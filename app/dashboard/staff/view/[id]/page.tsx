'use client';

import { use, useState, useEffect } from 'react';
import { Staff, AttendanceRecord } from '@/app/types';
import { staffApi, attendanceApi } from '@/lib/api';
import { Loader2, Mail, Phone, Briefcase, Building, ShieldCheck, Clock, Calendar, ChevronLeft, CalendarCheck, MapPin, Plus, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function StaffViewPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [staff, setStaff] = useState<Staff | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStaffAndAttendance = async () => {
            try {
                const [staffData, attendanceData] = await Promise.all([
                    staffApi.getById(id),
                    attendanceApi.getByStaffId(id)
                ]);

                setStaff(staffData);

                // Attendance might be nested or a single status object
                let attendanceList: AttendanceRecord[] = [];
                if (Array.isArray(attendanceData)) {
                    attendanceList = attendanceData;
                } else if (attendanceData && typeof attendanceData === 'object') {
                    // Extract from known wrappers
                    const extracted = (attendanceData as any).data || (attendanceData as any).attendance || (attendanceData as any).records || attendanceData;

                    if (Array.isArray(extracted)) {
                        attendanceList = extracted;
                    } else if (extracted && typeof extracted === 'object' && (extracted as any)._id) {
                        // It's a single record object, wrap it in an array
                        attendanceList = [extracted as AttendanceRecord];
                    }
                }
                setAttendance(attendanceList);
            } catch (err) {
                console.error('Failed to fetch staff details or attendance:', err);
                setError('Failed to load details. The staff member might not exist.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStaffAndAttendance();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
            </div>
        );
    }

    if (error || !staff) {
        return (
            <div className="max-w-2xl mx-auto mt-10">
                <Link href="/dashboard/staff" className="flex items-center text-sm text-gray-500 hover:text-orange-600 mb-6 transition-colors">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back to Staff
                </Link>
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20 text-center">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error || 'Staff member not found'}</h3>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link href="/dashboard/staff" className="flex items-center text-sm font-bold text-gray-400 hover:text-primary transition-all group">
                    <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-gray-100 dark:border-zinc-800 mr-3 group-hover:scale-110">
                        <ChevronLeft className="h-4 w-4" />
                    </div>
                    Back to Management
                </Link>
                <Link
                    href={`/dashboard/staff/${id}`}
                    className="inline-flex items-center gap-x-2 rounded-2xl bg-white dark:bg-zinc-800 px-5 py-3 text-sm font-bold text-foreground shadow-sm ring-1 ring-gray-200 dark:ring-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all"
                >
                    <Plus className="h-4 w-4" />
                    Edit Details
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white dark:bg-zinc-900 rounded-4xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden group">
                        <div className="h-32 bg-primary relative">
                            <div className="absolute inset-0 bg-linear-to-b from-black/10 to-transparent" />
                        </div>
                        <div className="relative px-8 pb-8">
                            <div className="relative -mt-16 flex justify-center">
                                <div className="h-32 w-32 rounded-3xl bg-white dark:bg-zinc-900 p-2 shadow-2xl transition-transform group-hover:scale-105">
                                    <div className="h-full w-full rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-primary font-black text-4xl shadow-inner uppercase">
                                        {staff.name?.[0]}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 text-center">
                                <h1 className="text-2xl font-black text-foreground tracking-tight">{staff.name}</h1>
                                <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">{staff.role}</p>
                                <div className="mt-4 flex justify-center">
                                    <span className={cn(
                                        "inline-flex items-center rounded-full px-4 py-1 text-xs font-black ring-1 ring-inset uppercase tracking-tighter",
                                        staff.status === 'active'
                                            ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-gray-50 text-gray-500 ring-gray-400/20 dark:bg-zinc-800 dark:text-gray-400"
                                    )}>
                                        {staff.status}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-10 space-y-5">
                                <div className="flex items-center gap-4 group/item">
                                    <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400 group-hover/item:text-primary transition-colors">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                                        <p className="text-sm font-bold text-foreground truncate">{staff.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group/item">
                                    <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400 group-hover/item:text-primary transition-colors">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</p>
                                        <p className="text-sm font-bold text-foreground">{staff.phone || 'No contact set'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group/item">
                                    <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400 group-hover/item:text-primary transition-colors">
                                        <Building className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department</p>
                                        <p className="text-sm font-bold text-foreground">
                                            {(typeof staff.department === 'object' && staff.department !== null) ? (staff.department as any).name : (staff.department || 'General Administration')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-4xl shadow-sm border border-gray-100 dark:border-zinc-800 space-y-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Engagement Overview</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex items-center justify-between p-4 rounded-3xl bg-gray-50 dark:bg-zinc-800/50">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Days Present</p>
                                    <p className="text-4xl font-black text-primary mt-2">{attendance.filter(a => a.status === 'present').length}</p>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center">
                                    <CalendarCheck className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-3xl bg-gray-50 dark:bg-zinc-800/50">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Logs</p>
                                    <p className="text-4xl font-black text-foreground mt-2">{attendance.length}</p>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Attendance History */}
                <div className="lg:col-span-8 space-y-8 h-full">
                    <div className="bg-white dark:bg-zinc-900 rounded-4xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col min-h-full">
                        <div className="px-8 py-8 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">Timeline History</h2>
                            </div>
                            <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">Clear History</button>
                        </div>

                        <div className="flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-zinc-800/30">
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Calendar Date</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendance Status</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Time of Entry</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                    {attendance.length > 0 ? (
                                        attendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record) => (
                                            <tr key={record._id} className="group hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-all">
                                                <td className="px-8 py-6 text-sm font-bold text-foreground">
                                                    {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black ring-1 ring-inset uppercase tracking-tighter",
                                                        record.status === 'present'
                                                            ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400"
                                                            : "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400"
                                                    )}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-sm font-bold text-gray-400 text-right group-hover:text-foreground transition-colors">
                                                    {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-24 text-center">
                                                <div className="inline-flex p-4 rounded-3xl bg-gray-50 dark:bg-zinc-800 mb-4">
                                                    <Calendar className="h-8 w-8 text-gray-200" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-400">No attendance data collected yet.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-foreground dark:bg-zinc-900 rounded-4xl p-8 shadow-2xl relative overflow-hidden group">
                        <div className="flex items-start gap-6 relative z-10">
                            <div className="h-16 w-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-primary shadow-xl group-hover:scale-110 transition-transform">
                                <ShieldCheck className="h-8 w-8" />
                            </div>
                            <div className="space-y-4 max-w-lg">
                                <h4 className="text-xl font-black text-white tracking-tight">Security & Compliance Policy</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    System activity is logged 24/7. All attendance records are cryptographically verified to ensure data integrity.
                                    Late arrivals are automatically flagged by the URNI core.
                                </p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 p-8">
                            <TrendingUp className="h-20 w-20 text-white/5" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
