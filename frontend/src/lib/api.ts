import axios from 'axios';

// API Configuration - Centralized API URL management
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://asamblea.cloud';

// Create a configured axios instance
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a response interceptor to handle session expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Solo disparamos el evento si parece ser un error de token/sesión
            const message = error.response.data?.message || "";
            if (message.toLowerCase().includes("vencido") ||
                message.toLowerCase().includes("expired") ||
                message.toLowerCase().includes("jwt") ||
                error.response.status === 401) {

                // Evitamos disparos múltiples seguidos
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('session-expired'));
                }
            }
        }
        return Promise.reject(error);
    }
);

// For use with axios instances
export const apiConfig = {
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
};

// Helper to get API endpoint
export const getApiUrl = (endpoint: string): string => {
    return `${API_URL}${endpoint}`;
};
