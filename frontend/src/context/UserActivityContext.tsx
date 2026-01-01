"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserStats {
    total: number;
    usuales: number;
    activos: number;
}

interface UserActivityContextType {
    stats: UserStats;
    loading: boolean;
    refresh: () => Promise<void>;
}

const UserActivityContext = createContext<UserActivityContextType | undefined>(undefined);

export function UserActivityProvider({ children }: { children: ReactNode }) {
    const [stats, setStats] = useState<UserStats>({
        total: 0,
        usuales: 0,
        activos: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch("/api/usuarios/estadisticas", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error al obtener estadísticas de actividad:", error);
        } finally {
            setLoading(false);
        }
    };

    const sendHeartbeat = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            await fetch("/api/usuarios/heartbeat", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
        } catch (error) {
            // Silently fail
        }
    };

    useEffect(() => {
        // Carga inicial
        fetchStats();
        sendHeartbeat();

        // Intervalo para estadísticas (cada 3 segundos para sincronización rápida)
        const statsInterval = setInterval(fetchStats, 3000);

        // Intervalo para heartbeat (cada 10 segundos es suficiente)
        const heartbeatInterval = setInterval(sendHeartbeat, 10000);

        // Notificar salida
        const notifyLeaving = () => {
            const token = localStorage.getItem("token");
            if (token && navigator.sendBeacon) {
                navigator.sendBeacon("/api/usuarios/leaving", JSON.stringify({ token }));
            }
        };

        window.addEventListener('beforeunload', notifyLeaving);

        // Actualizar al volver a la pestaña
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                sendHeartbeat();
                fetchStats();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(statsInterval);
            clearInterval(heartbeatInterval);
            window.removeEventListener('beforeunload', notifyLeaving);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return (
        <UserActivityContext.Provider value={{ stats, loading, refresh: fetchStats }}>
            {children}
        </UserActivityContext.Provider>
    );
}

export function useUserActivity() {
    const context = useContext(UserActivityContext);
    if (context === undefined) {
        throw new Error('useUserActivity must be used within a UserActivityProvider');
    }
    return context;
}
