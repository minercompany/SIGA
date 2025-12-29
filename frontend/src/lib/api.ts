// API Configuration - Centralized API URL management
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://asamblea.cloud';

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
