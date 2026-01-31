import axios from 'axios';
import { AuthResponse, Staff } from '@/app/types';

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

export const staffApi = {
    getAll: async (): Promise<Staff[]> => {
        try {
            const response = await api.get('api/lookups/users');
            return response.data;
        } catch (e) {
            throw e;
        }
    },
    getById: async (id: string): Promise<Staff> => {
        try {
            const response = await api.get(`api/lookups/users/${id}`);
            return response.data;
        } catch (e) {
            throw e;
        }
    },
    getMe: async (): Promise<Staff> => {
        try {
            const response = await api.get('api/lookups/users/me');
            return response.data;
        } catch (e) {
            throw e;
        }
    },
};

export default api;
