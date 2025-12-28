"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Users,
    ShieldCheck,
    AlertTriangle,
    TrendingUp,
    Clock,
    Building2,
    RefreshCw
} from "lucide-react";
import axios from "axios";

interface Estadisticas {
    totalPadron: number;
    conVozYVoto: number;
    soloVoz: number;
}

interface DesempenoSucursal {
    sucursalId: number;
    sucursal: string;
    padron: number;
    presentes: number;
    vozVoto: number;
    ratio: number;
}

interface ListaResumen {
    id: number;
    nombre: string;
    total: number;
    vyv: number;
    soloVoz: number;
}

import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { SocioDashboard } from "@/components/dashboard/SocioDashboard";
import { CountdownTimer } from "@/components/dashboard/CountdownTimer";

export default function DashboardPage() {
    const [stats, setStats] = useState<Estadisticas | null>(null);
    const [desempeno, setDesempeno] = useState<DesempenoSucursal[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [misListas, setMisListas] = useState<ListaResumen[]>([]);
    const [rankingOperadores, setRankingOperadores] = useState<any[]>([]);

    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const userData = localStorage.getItem("user");
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);

                const headers = { Authorization: `Bearer ${token}` };
                const isSocio = parsedUser.rol === "USUARIO_SOCIO";

                if (isSocio) {
                    try {
                        const listasRes = await axios.get("http://localhost:8081/api/asignaciones/mis-listas", { headers });
                        setMisListas(listasRes.data);
                    } catch (err) {
                        console.error("Error cargando listas del socio:", err);
                        setMisListas([]);
                    }
                } else {
                    const [statsRes, desempenoRes, rankingRes] = await Promise.all([
                        axios.get("http://localhost:8081/api/socios/estadisticas", { headers }),
                        axios.get("http://localhost:8081/api/socios/estadisticas/por-sucursal", { headers }),
                        // Cambiado a ranking de asignaciones en lugar de asistencia
                        axios.get("http://localhost:8081/api/asignaciones/ranking-usuarios", { headers })
                    ]);
                    setStats(statsRes.data);
                    setDesempeno(desempenoRes.data);

                    // Mapear respuesta del ranking de asignaciones al formato esperado por AdminDashboard
                    const mappedRanking = (rankingRes.data || []).map((item: any) => ({
                        nombre: item.nombre,
                        username: item.username,
                        totalRegistros: item.totalAsignados, // Mapeamos totalAsignados a totalRegistros
                        ...item
                    }));

                    setRankingOperadores(mappedRanking);
                }
            }
        } catch (error) {
            console.error("Error al cargar estadísticas:", error);
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sincronizando Dashboard...</p>
                </div>
            </div>
        );
    }

    const isSocioView = user?.rol === "USUARIO_SOCIO";

    return (
        <div className="animate-in fade-in duration-500">
            <CountdownTimer />

            {isSocioView ? (
                <SocioDashboard misListas={misListas} />
            ) : (
                <AdminDashboard stats={stats} desempeno={desempeno} ranking={rankingOperadores} onRefresh={fetchData} />
            )}

            {!isSocioView && (!stats || stats.totalPadron === 0) && (
                <div className="mt-8 rounded-3xl bg-amber-50 border border-amber-200 p-12 text-center">
                    <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-amber-800 mb-2 uppercase italic">Padrón Vacío</h2>
                    <p className="text-amber-700 font-medium mb-6">
                        Es necesario importar el padrón oficial de socios para activar las métricas del sistema.
                    </p>
                    <a
                        href="/importar"
                        className="inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-8 py-4 font-black text-white hover:bg-black transition-all shadow-xl shadow-slate-200 uppercase tracking-widest text-sm"
                    >
                        Ir a Importación
                    </a>
                </div>
            )}
        </div>
    );
}
