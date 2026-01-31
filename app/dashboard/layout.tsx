'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    LogOut,
    Menu,
    X,
    User as UserIcon,
} from 'lucide-react';
import { User } from '@/app/types';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        console.log("Dashboard Layout Mounted");
        // Basic auth check
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        console.log("Auth Check:", { token: !!token, userData: !!userData });

        if (!token) {
            console.log("No token, redirecting to login");
            router.push('/login');
        } else if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                console.log("User loaded:", parsedUser);
                setUser(parsedUser);
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }
    }, [router]);

    // ... rest of the file

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Staff Management', href: '/dashboard/staff', icon: Users },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-zinc-950">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed inset-y-0 z-50 flex w-72 flex-col bg-white dark:bg-zinc-900 transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-gray-200 dark:border-zinc-800",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-gray-200 dark:border-zinc-800 bg-white/50 backdrop-blur-md dark:bg-zinc-900/50">
                    <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                        AdminPanel
                    </span>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4 pt-5">
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-2">
                                    {navigation.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <li key={item.name}>
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        isActive
                                                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500/20'
                                                            : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-zinc-800/50',
                                                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200'
                                                    )}
                                                    onClick={() => setSidebarOpen(false)}
                                                >
                                                    <item.icon
                                                        className={cn(
                                                            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-white',
                                                            'h-6 w-6 shrink-0 transition-colors'
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                    {item.name}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </li>

                            <li className="mt-auto">
                                <button
                                    onClick={handleLogout}
                                    className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/10 dark:hover:text-red-400 w-full transition-colors"
                                >
                                    <LogOut
                                        className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-red-600 dark:text-gray-500 dark:group-hover:text-red-400 transition-colors"
                                        aria-hidden="true"
                                    />
                                    Log out
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            <div className="lg:pl-72 flex flex-col min-h-screen">
                {/* Header */}
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 shadow-sm dark:bg-zinc-900/80 dark:border-zinc-800 sm:gap-x-6 sm:px-6 lg:px-8 transition-all">
                    <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end items-center">
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            <div className="border-l border-gray-200 pl-4 md:pl-6 dark:border-gray-700">
                                <span className="flex items-center gap-2">
                                    <span className="sr-only">Your profile</span>
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                        {user?.name?.[0] || <UserIcon className="h-5 w-5" />}
                                    </div>
                                    <span className="hidden lg:flex lg:items-center">
                                        <span className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-white" aria-hidden="true">
                                            {user?.name || 'Admin'}
                                        </span>
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="py-10">
                    <div className="px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
