export interface User {
    id: string;
    name: string;
    email: string;
    role?: string;
    token?: string;
}

export interface Staff {
    _id: string;
    id?: string;
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
    severity: number;
    status: 'OPEN' | 'RESOLVED' | 'CLOSED';
    target_user_id: string;
    issued_by_id: string;
    created_at: string;
    resolved_at: string | null;
}
export interface AttendanceRecord {
    _id: string;
    userId: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    checkIn?: string;
    checkOut?: string;
}

export interface AttendanceResponse {
    success: boolean;
    count: number;
    data: AttendanceRecord[];
}
