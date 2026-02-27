'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    CalendarCheck,
    Clock,
    ChevronRight,
    Plus,
    BarChart3,
    Loader2,
    Ticket as TicketIcon,
    AlertCircle,
    ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api, { staffApi, attendanceApi, ticketApi, lookupApi, departmentApi } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
    const [staffCount, setStaffCount] = useState<number>(0);
    const [presentToday, setPresentToday] = useState<number>(0);
    const [latestStaff, setLatestStaff] = useState<any[]>([]);
    const [latestTickets, setLatestTickets] = useState<any[]>([]);
    const [departmentStats, setDepartmentStats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
    const [showWeekPicker, setShowWeekPicker] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [staffRes, attendanceRes, ticketsRes, deptRes] = await Promise.all([
                    api.get('api/users/staff').catch(() => ({ data: [] })),
                    api.get('api/attendance/status').catch(() => ({ data: [] })),
                    api.get('api/tickets').catch(() => ({ data: [] })),
                    api.get('api/departments').catch(() => ({ data: [] }))
                ]);

                const extractArray = (d: any, keys = ['departments', 'users', 'staff', 'tickets', 'attendance', 'data', 'results', 'items']): any[] => {
                    if (Array.isArray(d)) return d;
                    if (!d || typeof d !== 'object') return [];
                    // Check top-level array keys
                    for (const k of keys) {
                        if (Array.isArray(d[k])) return d[k];
                    }
                    // One level deeper check
                    if (d.data && typeof d.data === 'object' && !Array.isArray(d.data)) {
                        for (const k of keys) {
                            if (Array.isArray(d.data[k])) return d.data[k];
                        }
                    }
                    return [];
                };

                const allStaff = extractArray(staffRes.data);
                const allDepartments = extractArray(deptRes.data);
                const allTickets = extractArray(ticketsRes.data);
                const attendanceData = extractArray(attendanceRes.data);

                setStaffCount(allStaff.length);

                // Latest Staff (Real Data)
                const sortedStaff = [...allStaff]
                    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                    .slice(0, 5);
                setLatestStaff(sortedStaff);

                // Latest Tickets
                setLatestTickets(allTickets.slice(-3).reverse());

                // Department Breakdown: Calculate locally from allStaff for speed and reliability
                console.log('Calculating department stats locally from', allStaff.length, 'staff members &', allDepartments.length, 'departments');

                const stats = allDepartments.map((dept: any) => {
                    const deptId = dept._id || dept.id;
                    const deptName = dept.name;

                    // Filter staff that belong to this department
                    const count = allStaff.filter((s: any) => {
                        const sDeptId = s.department_id ||
                            (typeof s.department === 'object' && s.department ? (s.department as any)._id || (s.department as any).id : null);
                        const sDeptString = typeof s.department === 'string' ? s.department : '';

                        return sDeptId === deptId || sDeptString === deptName || sDeptString === deptId;
                    }).length;

                    return {
                        name: deptName,
                        count: count,
                        id: deptId
                    };
                });

                console.log('Final Department Stats (local calculation):', stats);

                // Sort by count descending and take top 5
                const sortedDepts = stats
                    .sort((a: any, b: any) => b.count - a.count)
                    .slice(0, 5);

                // Color palette for dynamic assignment
                const colors = [
                    'bg-primary',
                    'bg-blue-500',
                    'bg-green-500',
                    'bg-orange-500',
                    'bg-purple-500',
                    'bg-pink-500',
                    'bg-indigo-500'
                ];

                const finalDeptList = sortedDepts.map((item: any, index: number) => ({
                    name: item.name,
                    count: item.count,
                    color: colors[index % colors.length]
                }));

                setDepartmentStats(finalDeptList);

                // Attendance Calculation
                const today = new Date().toISOString().split('T')[0];
                const attendanceList = Array.isArray(attendanceData) ? attendanceData :
                    (attendanceData as any).data || (attendanceData as any).attendance || [];

                if (Array.isArray(attendanceList)) {
                    const daily = attendanceList.filter((record: any) => {
                        const recordDate = record.date ? record.date.split('T')[0] : '';
                        return recordDate === today && record.status === 'present';
                    }).length;
                    setPresentToday(daily);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Analytics & Staff (8/12) */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Weekly Attendance Pie Chart */}
                    <div className="bg-zinc-900 rounded-4xl p-8 shadow-sm border border-zinc-800 relative overflow-hidden group">
                        <div className="flex justify-between items-start relative z-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-zinc-800 p-2.5 rounded-2xl">
                                        <BarChart3 className="h-5 w-5 text-foreground" />
                                    </div>
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Weekly Attendance</h2>
                                </div>
                                <p className="text-gray-500 text-sm max-w-sm">
                                    Distribution of attendance across the 5 working days of the week.
                                </p>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setShowWeekPicker(!showWeekPicker)}
                                    className="bg-zinc-800 px-4 py-2 rounded-xl text-sm font-bold border border-zinc-700 flex items-center gap-2 hover:bg-zinc-700 transition-all"
                                >
                                    {(() => {
                                        const getWeekStart = (date: Date) => {
                                            const d = new Date(date);
                                            const day = d.getDay();
                                            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
                                            return new Date(d.setDate(diff));
                                        };

                                        const weekStart = getWeekStart(selectedWeek);
                                        const weekEnd = new Date(weekStart);
                                        weekEnd.setDate(weekStart.getDate() + 4); // Friday

                                        const formatDate = (date: Date) => {
                                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        };

                                        return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
                                    })()}
                                    <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", showWeekPicker && "rotate-180")} />
                                </button>

                                {showWeekPicker && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowWeekPicker(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-64 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 p-4 z-20">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Select Week</h4>
                                            <div className="space-y-2">
                                                {[0, -1, -2, -3].map((weekOffset) => {
                                                    const date = new Date();
                                                    date.setDate(date.getDate() + (weekOffset * 7));

                                                    const getWeekStart = (d: Date) => {
                                                        const day = d.getDay();
                                                        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                                                        return new Date(d.getFullYear(), d.getMonth(), diff);
                                                    };

                                                    const weekStart = getWeekStart(date);
                                                    const weekEnd = new Date(weekStart);
                                                    weekEnd.setDate(weekStart.getDate() + 4);

                                                    const formatDate = (d: Date) => {
                                                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                    };

                                                    const isSelected = getWeekStart(selectedWeek).getTime() === weekStart.getTime();

                                                    return (
                                                        <button
                                                            key={weekOffset}
                                                            onClick={() => {
                                                                setSelectedWeek(weekStart);
                                                                setShowWeekPicker(false);
                                                            }}
                                                            className={cn(
                                                                "w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all",
                                                                isSelected
                                                                    ? "bg-primary text-white"
                                                                    : "hover:bg-zinc-800 text-foreground"
                                                            )}
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <span>{formatDate(weekStart)} - {formatDate(weekEnd)}</span>
                                                                {weekOffset === 0 && (
                                                                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Current</span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Pie Chart Area */}
                        <div className="mt-12 flex items-center justify-between gap-8">
                            {/* Pie Chart */}
                            <div className="flex-1 flex items-center justify-center">
                                <div className="relative w-56 h-56">
                                    {/* SVG Pie Chart */}
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        {(() => {
                                            const weekData = [
                                                { day: 'Monday', value: 85, color: '#64748b' },      // Slate
                                                { day: 'Tuesday', value: 92, color: '#0891b2' },     // Cyan
                                                { day: 'Wednesday', value: 78, color: '#d97706' },   // Amber
                                                { day: 'Thursday', value: 88, color: '#6366f1' },    // Indigo
                                                { day: 'Friday', value: 95, color: '#e11d48' },      // Rose
                                            ];
                                            const total = weekData.reduce((sum, d) => sum + d.value, 0);
                                            let currentAngle = 0;

                                            return weekData.map((segment, i) => {
                                                const percentage = segment.value / total;
                                                const angle = percentage * 360;
                                                const radius = 15.9155; // circumference = 100
                                                const offset = 100 - (percentage * 100);

                                                const slice = (
                                                    <circle
                                                        key={i}
                                                        cx="50"
                                                        cy="50"
                                                        r={radius}
                                                        fill="transparent"
                                                        stroke={segment.color}
                                                        strokeWidth="32"
                                                        strokeDasharray={`${percentage * 100} ${100 - (percentage * 100)}`}
                                                        strokeDashoffset={-currentAngle * 100 / 360}
                                                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                                                    />
                                                );
                                                currentAngle += angle;
                                                return slice;
                                            });
                                        })()}
                                    </svg>
                                    {/* Center Label */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black text-foreground tracking-tighter">
                                            {Math.round((presentToday / (staffCount || 1)) * 100)}%
                                        </span>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">
                                            Today
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex-1 space-y-4">
                                {[
                                    { day: 'Monday', value: 85, color: 'bg-slate-500' },
                                    { day: 'Tuesday', value: 92, color: 'bg-cyan-600' },
                                    { day: 'Wednesday', value: 78, color: 'bg-amber-600' },
                                    { day: 'Thursday', value: 88, color: 'bg-indigo-500' },
                                    { day: 'Friday', value: 95, color: 'bg-rose-600' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between group/item cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-4 h-4 rounded-full transition-all group-hover/item:scale-110", item.color)} />
                                            <span className="text-sm font-bold text-foreground group-hover/item:text-primary transition-colors">
                                                {item.day}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-gray-400">
                                                {item.value}%
                                            </span>
                                            <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-700", item.color)}
                                                    style={{ width: `${item.value}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Latest Staff Card (Full Width in Left Column now) */}
                    <div className="bg-zinc-900 rounded-4xl p-8 shadow-sm border border-zinc-800">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-950/30 p-2 rounded-xl">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <h3 className="text-2xl font-black text-foreground tracking-tight">Latest Staff Registrations</h3>
                            </div>
                            <Link href="/dashboard/staff" className="text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                                Manage Team <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {latestStaff.map((person, i) => (
                                <Link
                                    key={i}
                                    href={`/dashboard/staff/view/${person._id || person.id}`}
                                    className="flex items-center justify-between p-4 rounded-3xl bg-zinc-800/50 transition-all hover:scale-[1.02] hover:bg-zinc-800 shadow-xs hover:shadow-md border border-transparent hover:border-gray-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-primary font-black shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                                            {person.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground leading-none">{person.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{person.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-zinc-900 text-gray-500 px-3 py-1 rounded-full border border-zinc-700 font-bold">
                                            {person.status}
                                        </span>
                                        <Plus className="h-4 w-4 text-gray-300" />
                                    </div>
                                </Link>
                            ))}
                            {latestStaff.length === 0 && (
                                <p className="col-span-2 py-8 text-center text-sm text-gray-400 font-bold">No recent registrations found.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-zinc-900 rounded-4xl p-8 shadow-sm border border-zinc-800">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-950/30 p-2 rounded-xl">
                                    <TicketIcon className="h-5 w-5 text-red-500" />
                                </div>
                                <h3 className="text-2xl font-black text-foreground tracking-tight">Recent Disciplinary Tickets</h3>
                            </div>
                            <Link href="/dashboard/tickets" className="text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                                View Archive <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {latestTickets.map((ticket, i) => (
                                <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-zinc-800/50 border border-transparent hover:border-red-100 transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">
                                            <AlertCircle className={cn(
                                                "h-5 w-5",
                                                ticket.severity >= 3 ? "text-red-500" : "text-orange-500"
                                            )} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground leading-none">{ticket.title}</p>
                                            <p className="text-xs text-gray-400 mt-2 line-clamp-1">{ticket.description}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                                        LVL {ticket.severity}
                                    </span>
                                </div>
                            ))}
                            {latestTickets.length === 0 && (
                                <div className="py-10 text-center">
                                    <p className="text-sm font-bold text-gray-300 italic">No recent disciplinary actions recorded.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Organizational Breakdown (4/12) */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-zinc-900 rounded-4xl p-8 shadow-sm border border-zinc-800 flex flex-col h-fit">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-3">
                                <div className="bg-zinc-800 p-2 rounded-xl text-foreground">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">Departments</h2>
                            </div>
                            <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-zinc-800 px-3 py-1 rounded-full">
                                {departmentStats.length} Groups
                            </div>
                        </div>

                        <div className="space-y-6">
                            {departmentStats.map((item, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <div className="flex items-start gap-4">
                                        <div className={cn("mt-1 h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all group-hover:scale-110", item.color)}>
                                            <Plus className="h-5 w-5" /> {/* Department Icon */}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{item.name}</h4>
                                                <span className="text-lg font-black text-foreground">{item.count}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-700", item.color)}
                                                    style={{ width: `${(item.count / staffCount) * 100}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-1">
                                                {Math.round((item.count / staffCount) * 100)}% of total workforce
                                            </p>
                                        </div>
                                    </div>
                                    {i < departmentStats.length - 1 && (
                                        <div className="mt-6 border-zinc-800" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Attendance Progress Minimalist Card (at bottom of Breakdown) */}
                        <div className="mt-12 pt-10 border-zinc-800">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-400">Total Statistics</h3>
                                <button className="text-[10px] bg-orange-50 text-primary px-3 py-1 rounded-full font-black flex items-center gap-1 uppercase">Today</button>
                            </div>
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Staff</p>
                                    <p className="text-4xl font-black mt-2 text-foreground">{staffCount}</p>
                                </div>
                                <div className="border-l border-primary pl-6 h-12 flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Today</p>
                                    <p className="text-4xl font-black mt-2 text-foreground">{presentToday}</p>
                                </div>
                            </div>
                            <div className="mt-8 flex items-end gap-1.5 h-12">
                                {[1, 2, 3, 2, 4, 3, 5, 2, 3, 4, 3].map((h, i) => (
                                    <div key={i} className="flex-1 bg-zinc-800 rounded-full hover:bg-primary transition-colors cursor-pointer" style={{ height: `${h * 20}%` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
