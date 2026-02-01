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
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { staffApi, attendanceApi, ticketApi } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
    const [staffCount, setStaffCount] = useState<number>(0);
    const [presentToday, setPresentToday] = useState<number>(0);
    const [latestStaff, setLatestStaff] = useState<any[]>([]);
    const [latestTickets, setLatestTickets] = useState<any[]>([]);
    const [departmentStats, setDepartmentStats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [staffData, attendanceData, ticketsData] = await Promise.all([
                    staffApi.getAll(),
                    attendanceApi.getAll(),
                    ticketApi.getAll()
                ]);

                const allStaff = Array.isArray(staffData) ? staffData :
                    (staffData as any).data || (staffData as any).users || [];

                setStaffCount(allStaff.length);

                // Latest Staff (Real Data)
                const sortedStaff = [...allStaff]
                    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                    .slice(0, 5);
                setLatestStaff(sortedStaff);

                // Latest Tickets
                const allTickets = Array.isArray(ticketsData) ? ticketsData :
                    (ticketsData as any).data || (ticketsData as any).tickets || [];
                setLatestTickets(allTickets.slice(-3).reverse());

                // Department Breakdown
                const depts: Record<string, number> = {};
                allStaff.forEach((s: any) => {
                    const dName = (typeof s.department === 'object' && s.department !== null)
                        ? s.department.name
                        : (s.department || 'General');
                    depts[dName] = (depts[dName] || 0) + 1;
                });

                const deptList = Object.entries(depts).map(([name, count]) => ({
                    name,
                    count,
                    color: name.includes('Dev') ? 'bg-primary' :
                        name.includes('Ops') ? 'bg-blue-500' :
                            name.includes('Admin') ? 'bg-foreground' : 'bg-zinc-500'
                }));
                setDepartmentStats(deptList);

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
                    {/* Analytics Hero */}
                    <div className="bg-white dark:bg-zinc-900 rounded-4xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 relative overflow-hidden group">
                        <div className="flex justify-between items-start relative z-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 dark:bg-zinc-800 p-2.5 rounded-2xl">
                                        <BarChart3 className="h-5 w-5 text-foreground" />
                                    </div>
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Attendance Tracker</h2>
                                </div>
                                <p className="text-gray-500 text-sm max-w-sm">
                                    Real-time tracking of team presence and operational capacity across all departments.
                                </p>
                            </div>
                            <button className="bg-gray-50 dark:bg-zinc-800 px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 dark:border-zinc-700 flex items-center gap-2 hover:bg-white transition-all">
                                Week <Clock className="h-4 w-4 text-gray-400" />
                            </button>
                        </div>

                        {/* Chart Area */}
                        <div className="mt-12 flex items-end justify-between gap-2 h-44">
                            <div className="space-y-6 flex-1 text-center">
                                <span className="text-6xl font-black text-foreground tracking-tighter">
                                    {Math.round((presentToday / (staffCount || 1)) * 100)}%
                                </span>
                                <p className="text-xs font-black text-primary uppercase tracking-widest mx-auto leading-tight">
                                    Current Capacity
                                </p>
                            </div>
                            {/* Mock Bar Chart */}
                            <div className="flex-2 flex items-end justify-around h-full gap-4">
                                {[
                                    { day: 'S', h: '40%', active: false },
                                    { day: 'M', h: '65%', active: false },
                                    { day: 'T', h: '90%', active: true, val: `${presentToday}` },
                                    { day: 'W', h: '55%', active: false },
                                    { day: 'T', h: '70%', active: false },
                                    { day: 'F', h: '85%', active: false },
                                    { day: 'S', h: '50%', active: false },
                                ].map((bar, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3 group/bar">
                                        <div className="relative w-12 h-40 flex items-end justify-center">
                                            {bar.active && (
                                                <div className="absolute -top-10 bg-foreground text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-lg mb-2 z-20 whitespace-nowrap">
                                                    {bar.val} present
                                                </div>
                                            )}
                                            <div className="w-1 h-32 bg-gray-100 dark:bg-zinc-800 rounded-full absolute left-1/2 -translate-x-1/2" />
                                            <div
                                                className={cn(
                                                    "w-3 rounded-full relative z-10 transition-all duration-500",
                                                    bar.active ? "bg-foreground h-10" : "bg-primary/40 group-hover/bar:bg-primary h-2"
                                                )}
                                                style={{ bottom: bar.h }}
                                            />
                                            {bar.active && (
                                                <div className="absolute w-12 h-32 bg-gray-50/50 dark:bg-zinc-800/50 rounded-2xl top-0 translate-y-6" />
                                            )}
                                        </div>
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                                            bar.active ? "bg-foreground text-white shadow-xl" : "bg-gray-100 dark:bg-zinc-800 text-gray-500"
                                        )}>
                                            {bar.day}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Latest Staff Card (Full Width in Left Column now) */}
                    <div className="bg-white dark:bg-zinc-900 rounded-4xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded-xl">
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
                                    className="flex items-center justify-between p-4 rounded-3xl bg-gray-50 dark:bg-zinc-800/50 transition-all hover:scale-[1.02] hover:bg-white dark:hover:bg-zinc-800 shadow-xs hover:shadow-md border border-transparent hover:border-gray-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-primary font-black shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                                            {person.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground leading-none">{person.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{person.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-white dark:bg-zinc-900 text-gray-500 px-3 py-1 rounded-full border border-gray-100 dark:border-zinc-700 font-bold">
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

                    <div className="bg-white dark:bg-zinc-900 rounded-4xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-50 dark:bg-red-950/30 p-2 rounded-xl">
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
                                <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-gray-50 dark:bg-zinc-800/50 border border-transparent hover:border-red-100 transition-all">
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
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border border-gray-100 dark:border-zinc-800">
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
                    <div className="bg-white dark:bg-zinc-900 rounded-4xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-3">
                                <div className="bg-gray-100 dark:bg-zinc-800 p-2 rounded-xl text-foreground">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">Departments</h2>
                            </div>
                            <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-50 dark:bg-zinc-800 px-3 py-1 rounded-full">
                                {departmentStats.length} Groups
                            </div>
                        </div>

                        <div className="space-y-6 flex-1">
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
                                            <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-2">
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
                                        <div className="mt-6 border-b border-gray-50 dark:border-zinc-800" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Attendance Progress Minimalist Card (at bottom of Breakdown) */}
                        <div className="mt-12 pt-10 border-t border-gray-100 dark:border-zinc-800">
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
                                    <div key={i} className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-primary transition-colors cursor-pointer" style={{ height: `${h * 20}%` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
