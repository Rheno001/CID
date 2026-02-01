'use client';

import { use, useState, useEffect } from 'react';
import { Staff, AttendanceRecord } from '@/app/types';
import { staffApi, attendanceApi } from '@/lib/api';
import { Loader2, Mail, Phone, Briefcase, Building, ShieldCheck, Clock, Calendar, ChevronLeft, CalendarCheck, MapPin } from 'lucide-react';
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
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <Link href="/dashboard/staff" className="flex items-center text-sm text-gray-500 hover:text-orange-600 mb-2 transition-colors">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back to Staff Management
            </Link>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Profile</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Detailed overview and attendance history for {staff.name}.</p>
                </div>
                <Link
                    href={`/dashboard/staff/${id}`}
                    className="inline-flex items-center gap-x-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700"
                >
                    Edit Details
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="overflow-hidden bg-white shadow-xl rounded-2xl dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                        <div className="h-24 bg-orange-500" />
                        <div className="relative px-6 pb-6">
                            <div className="relative -mt-12 flex justify-center">
                                <div className="h-24 w-24 rounded-2xl bg-white p-1 shadow-lg dark:bg-zinc-800">
                                    <div className="h-full w-full rounded-xl bg-gray-500 flex items-center justify-center text-orange-500 font-bold text-3xl">
                                        {staff.name?.[0]}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{staff.name}</h2>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{staff.role}</p>
                                <span className={cn(
                                    "mt-3 inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ring-1 ring-inset",
                                    staff.status === 'active'
                                        ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-900/30 dark:text-gray-400"
                                )}>
                                    {staff.status}
                                </span>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-300 truncate">{staff.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-300">{staff.phone || 'No phone'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Building className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-300">
                                        {(typeof staff.department === 'object' && staff.department !== null) ? (staff.department as any).name : (staff.department || 'General')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-zinc-800 dark:ring-zinc-700">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/20">
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{attendance.filter(a => a.status === 'present').length}</p>
                                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Days Present</p>
                            </div>
                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/20">
                                <p className="text-2xl font-bold text-gray-500">{attendance.length}</p>
                                <p className="text-xs text-gray-500 mt-1">Total Logs</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Attendance History */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white shadow-sm rounded-2xl dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CalendarCheck className="h-5 w-5 text-orange-600" />
                                Attendance History
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-zinc-800/50">
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check In</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check Out</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                    {attendance.length > 0 ? (
                                        attendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record) => (
                                            <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200 font-medium">
                                                    {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                        record.status === 'present'
                                                            ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400"
                                                            : "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400"
                                                    )}>
                                                        {record.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                                No attendance records found for this staff member.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-linear-to-br from-orange-500 to-amber-600 rounded-2xl p-6 shadow-lg text-white">
                        <div className="flex items-start gap-4">
                            <Clock className="h-8 w-8 text-white/80" />
                            <div>
                                <h4 className="text-lg font-bold">Attendance Policy</h4>
                                <p className="text-white/80 text-sm mt-2">
                                    Staff are expected to check in by 9:00 AM. Three late arrivals in a month will result in a notification to the manager.
                                    Please ensure all check-outs are recorded before leaving.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
