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
    staff_id?: string; // Auto-generated
    name: string;
    email: string;
    role: string;
    department: string;
    department_id?: string | null;
    company_id?: string | null;
    branch_id?: string | null;
    password?: string;
    phone?: string;
    dob?: string;
    profile_picture?: string;
    profile_pic_url?: string | null; // API field name
    address?: string;
    reports_to?: string;
    reports_to_id?: string | null; // API field name
    status: 'active' | 'inactive';
    is_active?: boolean;
    leave_balance?: number; // Default: 20
    stats_score?: number; // Default: 100
    createdAt?: string;
    created_at?: string; // API field name
    updated_at?: string; // API field name
}

export interface Role {
    _id: string;
    name: string;
}


export interface Department {
    _id: string;
    id?: string;
    name: string;
    company_id?: string;
    branch_id?: string;
    head_id?: string | null;
}

export interface Company {
    _id: string;
    name: string;
    logo?: string;
    abbreviation?: string;
    address?: string;
}

export interface Branch {
    _id: string;
    name: string;
    address: string;
    location_city: string;
    gps_lat: number;
    gps_long: number;
    radius_meters: string;
    company_id?: string;
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

export interface Appraisal {
    date: string;
    achievements: string;
    challenges: string;
    workplace: string;
    createdAt: string;
}

export interface AppraisalResponse {
    status: string;
    data: {
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
        };
        period: string;
        totalLogs: number;
        logs: Appraisal[];
    };
}
