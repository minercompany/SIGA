"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

interface ConfigState {
    nombreAsamblea: string;
    fechaAsamblea: string;
    updateConfig: (clave: string, valor: string) => Promise<void>;
    refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigState | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<Record<string, string>>({});

    const refreshConfig = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                // Sin token, usar valores por defecto silenciosamente
                return;
            }
            const response = await axios.get("/api/configuracion", {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000 // 5 segundos timeout
            });
            if (response.data) {
                setConfig(response.data);
            }
        } catch (error) {
            // Silenciosamente usar valores por defecto si el backend no responde
            console.warn("Usando configuración por defecto");
        }
    };

    useEffect(() => {
        refreshConfig();
    }, []);

    const updateConfig = async (clave: string, valor: string) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post("/api/configuracion", {
                [clave]: valor
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await refreshConfig();
        } catch (error) {
            console.error("Error guardando configuración:", error);
            throw error;
        }
    };

    const nombreAsamblea = config["ASAMBLEA_NOMBRE"] || "ASAMBLEA GENERAL ORDINARIA 2026";
    const fechaAsamblea = config["ASAMBLEA_FECHA"] || "2026-01-15";

    return (
        <ConfigContext.Provider value={{ nombreAsamblea, fechaAsamblea, updateConfig, refreshConfig }}>
            {children}
        </ConfigContext.Provider>
    );
}

export function useConfig() {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error("useConfig must be used within a ConfigProvider");
    }
    return context;
}
