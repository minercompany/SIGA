import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://asamblea.cloud/api';

interface User {
    id: number;
    username: string;
    nombreCompleto: string;
    rol: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            const storedUser = await AsyncStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            }
        } catch (error) {
            console.error('Error cargando autenticación:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                username,
                password
            });

            const { token: newToken, user: userData } = response.data;

            await AsyncStorage.setItem('token', newToken);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            setToken(newToken);
            setUser(userData);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

            return true;
        } catch (error) {
            console.error('Error en login:', error);
            return false;
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
}
