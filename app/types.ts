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
  staff_id?: string;
  name: string;
  email: string;
  role: string;
  department?: string | Department;
  department_id?: string | null;
  company_id?: string | null;
  branch_id?: string | null;
  phone?: string;
  dob?: string;
  address?: string;
  profile_picture?: string | File;
  profile_pic_url?: string | null;
  reports_to?: string;
  reports_to_id?: string | null;
  password?: string;
  employment_type?:
    | "FULLTIME"
    | "CONTRACT"
    | "CORPER"
    | "GRADUATE_INTERN"
    | "STUDENT_INTERN";
  status?: "active" | "inactive";
  is_active?: boolean;
  leave_balance?: number;
  stats_score?: number;
  created_at?: string;
  updated_at?: string;
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
  status: "OPEN" | "RESOLVED" | "CONTESTED" | "VOIDED";
  target_user_id: string;
  issuer_id?: string;
  is_anonymous?: boolean;
  contest_note?: string;
  contest_image?: string;
  created_at: string;
  resolved_at: string | null;
  target_user?: {
    id: string;
    name: string;
    email: string;
  };
  issuer?: {
    id: string;
    name: string;
    email: string;
  };
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
