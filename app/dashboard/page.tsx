'use client';

import { useState, useEffect } from 'react';
import { Users, Building2, Ticket, TrendingUp, Clock, AlertCircle, Loader2, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { staffApi, attendanceApi } from '@/lib/api';

export default function DashboardPage() {
    const [stats, setStats] = useState([
        {
            name: 'Total Staff',
            stat: '...',
            change: 'Loading...',
            icon: Users,
            color: 'bg-orange-500',
            gradient: 'from-orange-600 to-orange-400'
        },
        {
            name: "Today's Attendance",
            stat: '...',
            change: 'Updating...',
            icon: CalendarCheck,
            color: 'bg-green-500',
            gradient: 'from-green-600 to-green-400'
        },
        {
            name: 'Active Departments',
            stat: '4',
            change: 'Stable',
            icon: Building2,
            color: 'bg-amber-500',
            gradient: 'from-amber-600 to-amber-400'
        },
    ]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [staffData, attendanceData] = await Promise.all([
                    staffApi.getAll(),
                    attendanceApi.getAll()
                ]);

                const totalStaff = Array.isArray(staffData) ? staffData.length :
                    (staffData as any).data?.length || (staffData as any).users?.length || 0;

                // Calculate today's attendance
                const today = new Date().toISOString().split('T')[0];
                let todayRecordCount = 0;

                const attendanceList = Array.isArray(attendanceData) ? attendanceData :
                    (attendanceData as any).data || (attendanceData as any).attendance || [];

                if (Array.isArray(attendanceList)) {
                    todayRecordCount = attendanceList.filter((record: any) => {
                        const recordDate = record.date ? record.date.split('T')[0] : '';
                        return recordDate === today && record.status === 'present';
                    }).length;
                }

                setStats([
                    {
                        name: 'Total Staff',
                        stat: totalStaff.toString(),
                        change: 'Total registered members',
                        icon: Users,
                        color: 'bg-orange-500',
                        gradient: 'from-orange-600 to-orange-400'
                    },
                    {
                        name: "Today's Attendance",
                        stat: todayRecordCount.toString(),
                        change: `Present on ${new Date().toLocaleDateString()}`,
                        icon: CalendarCheck,
                        color: 'bg-green-500',
                        gradient: 'from-green-600 to-green-400'
                    },
                    {
                        name: 'Active Departments',
                        stat: '4',
                        change: 'Central Administration',
                        icon: Building2,
                        color: 'bg-amber-500',
                        gradient: 'from-amber-600 to-amber-400'
                    },
                ]);
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-2xl bg-orange-500 p-8 shadow-lg dark:from-orange-900 dark:via-red-900 dark:to-amber-900">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-white">Welcome back, Admin!</h2>
                    <p className="mt-2 text-orange-100">Here's what's happening with your team today.</p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 blur-3xl transform skew-x-12" />
            </div>

            {/* Stats Grid */}
            <div>
                <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100 mb-4">Overview</h3>
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                    </div>
                ) : (
                    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                        {stats.map((item) => (
                            <div key={item.name} className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-all hover:shadow-md dark:bg-zinc-800 dark:ring-zinc-700">
                                <div className="flex items-center gap-4">
                                    <div className={cn("rounded-lg p-3 text-white shadow-md", item.color, `bg-linear-to-br ${item.gradient}`)}>
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.name}</dt>
                                        <dd className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{item.stat}</dd>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <span>{item.change}</span>
                                </div>
                            </div>
                        ))}
                    </dl>
                )}
            </div>

            {/* Recent Activity / Placeholder for functionality */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-zinc-800 dark:ring-zinc-700">
                    <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-400" />
                        Recent Activity
                    </h4>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0 dark:border-zinc-700">
                                <div className="h-2 w-2 rounded-full bg-orange-500" />
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-medium text-gray-900 dark:text-white">Attendance system</span> synchronized successfully.
                                </p>
                                <span className="ml-auto text-xs text-gray-400">{i}h ago</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-zinc-800 dark:ring-zinc-700">
                    <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                        System Status
                    </h4>
                    <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                        <div className="flex">
                            <div className="shrink-0">
                                <AlertCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-300">All systems operational</h3>
                                <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                                    <p>Database, API, and Staff services are running smoothly.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
                <h4 className="card-title mb-4 text-lg font-medium dark:text-white">Welcome to the Staff Management System</h4>
                <p className="text-gray-600 dark:text-gray-400">
                    Select "Staff Management" from the sidebar to view, add, edit, or delete staff members. Attendance is now tracked automatically.
                </p>
            </div>
        </div>
    );
}
