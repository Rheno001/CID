export interface User {
    id: string;
    name: string;
    email: string;
    token?: string;
}

export interface Staff {
    _id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    phone?: string;
    status: 'active' | 'inactive';
    createdAt?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'closed';
    priority: 'low' | 'medium' | 'high';
    createdAt: string;
    userId: string;
}
