import axios from 'axios';

import { AuthResponse, Staff, Ticket, Role, Department, Company, Branch } from '@/app/types';

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
    getByDepartment: async (departmentId: string): Promise<Staff[]> => {
        try {
            console.log(`API Call: api/lookups/users?department_id=${departmentId}`);
            const response = await api.get(`api/lookups/users?department_id=${departmentId}`);
            const data = response.data;
            console.log(`Response for dept ${departmentId}:`, Array.isArray(data) ? `Array(${data.length})` : typeof data);

            let users: Staff[] = [];
            if (Array.isArray(data)) {
                users = data;
            } else if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
                users = (data as any).data;
            } else if (data && typeof data === 'object' && Array.isArray((data as any).users)) {
                users = (data as any).users;
            }

            // Client-side filtering to ensure accuracy (API might ignore param and return all users)
            return users.filter(user => {
                const uDeptId = user.department_id ||
                    (typeof user.department === 'object' && user.department ? (user.department as any)._id || (user.department as any).id : null);

                // If department is a string, it might be the ID or Name. 
                // We check against ID mostly.
                const uDeptString = typeof user.department === 'string' ? user.department : '';

                // Loose equality check for IDs (string vs likely string)
                return uDeptId == departmentId || uDeptString == departmentId;
            });
        } catch (e) {
            // Return empty array on error to allow other requests to proceed
            console.error(`Failed to fetch staff for department ${departmentId}`, e);
            return [];
        }
    },
    create: async (staffData: Partial<Staff>): Promise<any> => {
        try {
            const response = await api.post('api/auth/register', staffData);
            return response.data;
        } catch (e) {
            throw e;
        }
    },
    update: async (id: string, staffData: Partial<Staff>): Promise<any> => {
        try {
            console.log(`Updating staff at path: api/auth/update/${id}`);
            const response = await api.put(`api/auth/update/${id}`, staffData);
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

export const ticketApi = {
    getAll: async (): Promise<any> => {
        try {
            const response = await api.get('api/tickets');
            return response.data;
        } catch (e) {
            throw e;
        }
    },
    create: async (ticketData: Partial<Ticket>): Promise<any> => {
        try {
            const response = await api.post('api/tickets', ticketData);
            return response.data;
        } catch (e) {
            throw e;
        }
    },
};

export const lookupApi = {
    getRoles: async (): Promise<Role[]> => {
        try {
            const response = await api.get('api/lookups/roles');
            return response.data;
        } catch (e) {
            throw e;
        }
    },
    getDepartments: async (): Promise<Department[]> => {
        try {
            const response = await api.get('api/departments');
            const data = response.data;
            if (Array.isArray(data)) {
                return data;
            } else if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
                return (data as any).data;
            } else if (data && typeof data === 'object' && Array.isArray((data as any).departments)) {
                return (data as any).departments;
            }
            return [];
        } catch (e) {
            throw e;
        }
    },
};

export const departmentApi = {
    getById: async (id: string): Promise<any> => {
        try {
            const response = await api.get(`api/departments/${id}`);
            return response.data;
        } catch (e) {
            throw e;
        }
    },
    create: async (departmentData: Partial<Department>): Promise<any> => {
        try {
            const response = await api.post('api/departments', departmentData);
            return response.data;
        } catch (e) {
            throw e;
        }
    },
    getAll: async (): Promise<Department[]> => {
        try {
            const response = await api.get('api/departments');
            const data = response.data;
            if (Array.isArray(data)) {
                return data;
            } else if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
                return (data as any).data;
            } else if (data && typeof data === 'object' && Array.isArray((data as any).departments)) {
                return (data as any).departments;
            }
            return [];
        } catch (e) {
            throw e;
        }
    }
};

export const companyApi = {
    create: async (companyData: Partial<Company>): Promise<any> => {
        try {
            const response = await api.post('api/companies', companyData);
            return response.data;
        } catch (e) {
            throw e;
        }
    },
    getAll: async (): Promise<Company[]> => {
        try {
            const response = await api.get('api/companies');
            const data = response.data;
            if (Array.isArray(data)) {
                return data;
            } else if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
                return (data as any).data;
            } else if (data && typeof data === 'object' && Array.isArray((data as any).companies)) {
                return (data as any).companies;
            }
            return [];
        } catch (e) {
            throw e;
        }
    }
};

export const branchApi = {
    create: async (branchData: Partial<Branch>): Promise<any> => {
        try {
            const response = await api.post('api/branches', branchData);
            return response.data;
        } catch (e) {
            throw e;
        }
    },
    getAll: async (): Promise<Branch[]> => {
        try {
            const response = await api.get('api/branches');
            const data = response.data;
            if (Array.isArray(data)) {
                return data;
            } else if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
                return (data as any).data;
            } else if (data && typeof data === 'object' && Array.isArray((data as any).branches)) {
                return (data as any).branches;
            }
            return [];
        } catch (e) {
            throw e;
        }
    },
    getById: async (id: string): Promise<Branch> => {
        try {
            const response = await api.get(`api/branches/${id}`);
            return response.data;
        } catch (e) {
            throw e;
        }
    }
};


export default api;
