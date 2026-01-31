import { Users, Building2, Ticket, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const stats = [
        {
            name: 'Total Staff',
            stat: '24',
            change: '+12% from last month',
            icon: Users,
            color: 'bg-orange-500',
            gradient: 'from-orange-600 to-orange-400'
        },
        {
            name: 'Active Departments',
            stat: '4',
            change: 'Stable',
            icon: Building2,
            color: 'bg-amber-500',
            gradient: 'from-amber-600 to-amber-400'
        },
        {
            name: 'Pending Tickets',
            stat: '12',
            change: '5 High Priority',
            icon: Ticket,
            color: 'bg-red-500',
            gradient: 'from-red-600 to-red-400'
        },
    ];

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
                            <div className="mt-4 flex items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{item.change}</span>
                            </div>
                        </div>
                    ))}
                </dl>
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
                                    <span className="font-medium text-gray-900 dark:text-white">New staff member</span> added to Engineering.
                                </p>
                                <span className="ml-auto text-xs text-gray-400">2h ago</span>
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
                                    <p>Database, API, and Staff services are running smoothly with 99.9% uptime.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
                <h4 className="card-title mb-4 text-lg font-medium dark:text-white">Welcome to the Staff Management System</h4>
                <p className="text-gray-600 dark:text-gray-400">
                    Select "Staff Management" from the sidebar to view, add, edit, or delete staff members.
                </p>
            </div>
        </div>
    );
}
