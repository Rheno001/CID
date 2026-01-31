import axios from 'axios';
import { AuthResponse } from '@/app/types';

const API_URL = 'https://urni-project-backend-44bx.onrender.com';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to attach token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});


export const authApi = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        try {
            const response = await api.post('api/auth/login', { email, password });
            return response.data;
        } catch (e) {
            throw e;
        }
    },
};

export default api;
