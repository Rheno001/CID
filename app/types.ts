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
    profile_picture?: string | File;
    profile_pic_url?: string | null; // API field name
    address?: string;
    reports_to?: string;
    reports_to_id?: string | null; // API field name
    employment_type?: 'full_time' | 'graduate_intern' | 'volunteer' | 'contract_staff';
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
    id?: string;
    name: string;
    logo?: string;
    logo_url?: string;
    abbreviation?: string;
    address?: string;
    branch_id?: string;
}

export interface Branch {
    _id: string;
    id?: string;
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
    // old camelCase shape (kept for compatibility)
    _id?: string;
    userId?: string;
    date?: string;
    checkIn?: string;
    checkOut?: string;
    // real API snake_case shape
    id?: string;
    user_id?: string;
    branch_id?: string;
    clock_in_time?: string;
    clock_out_time?: string | null;
    created_at?: string;
    status: string; // "present" | "absent" | "LATE" | "PRESENT" | etc.
    is_manual_override?: boolean;
    is_weekend_work?: boolean;
    hours_worked?: number | null;
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
