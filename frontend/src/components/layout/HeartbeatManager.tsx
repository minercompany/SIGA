"use client";

import { useEffect } from "react";
import axios from "axios";

export const HeartbeatManager = () => {
    useEffect(() => {
        const sendHeartbeat = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                await axios.post("/api/usuarios/heartbeat", {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                // Silenciosamente fallar si hay error de red o auth
                console.log("Heartbeat failed");
            }
        };

        // Enviar primer heartbeat al cargar
        sendHeartbeat();

        // Configurar intervalo de 60 segundos
        const interval = setInterval(sendHeartbeat, 60000);

        return () => clearInterval(interval);
    }, []);

    return null; // Componente invisible
};
