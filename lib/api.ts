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
            const data = response.data;
            // Defensive check: handle nested data or user property
            if (data && typeof data === 'object' && data.data) {
                return data.data;
            } else if (data && typeof data === 'object' && data.user) {
                return data.user;
            }
            return data;
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

export const attendanceApi = {
    getAll: async (): Promise<any> => {
        try {
            const response = await api.get('api/attendance/status');
            return response.data;
        } catch (e) {
            throw e;
        }
    },
    getByStaffId: async (staffId: string): Promise<any> => {
        try {
            // Trying query parameter as path segment caused 404
            const response = await api.get(`api/attendance/status?staffId=${staffId}`);
            return response.data;
        } catch (e) {
            // Fallback to userId if staffId fails, or just throw
            throw e;
        }
    },
};

export default api;
