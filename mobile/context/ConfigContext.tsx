import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:8080/api';

interface Config {
    nombreAsamblea: string;
    fechaAsamblea: string;
    horaAsamblea: string;
}

interface ConfigContextType {
    config: Config | null;
    loadConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<Config | null>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const response = await axios.get(`${API_URL}/configuracion`);
            setConfig(response.data);
        } catch (error) {
            console.error('Error cargando configuración:', error);
        }
    };

    return (
        <ConfigContext.Provider value={{ config, loadConfig }}>
            {children}
        </ConfigContext.Provider>
    );
}

export function useConfig() {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error('useConfig debe usarse dentro de ConfigProvider');
    }
    return context;
}
