'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    LogOut,
    Menu,
    X,
    User as UserIcon,
    Ticket,
    Building2,
} from 'lucide-react';
import TBGLogo from '@/assets/TBG.webp';
import { User } from '@/app/types';
import { ThemeToggle } from '@/components/ThemeToggle';

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
        } else if (userData && userData !== 'undefined') {
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
        { name: 'Organization', href: '/dashboard/organization', icon: Building2 },
        { name: 'Staff Management', href: '/dashboard/staff', icon: Users },
        { name: 'Tickets', href: '/dashboard/tickets', icon: Ticket },
        { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-background selection:bg-orange-100 selection:text-orange-900">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-zinc-800/50 px-6 py-4">
                <div className="mx-auto max-w-(--breakpoint-2xl) flex items-center justify-between gap-8">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="relative h-10 w-auto">
                            <Image
                                src={TBGLogo}
                                alt="TBG Logo"
                                height={40}
                                width={120} // Approximate width, it will maintain aspect ratio due to height and style="auto" usually, strictly explicit width/height helps avoid CLS.
                                className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                                priority
                            />
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200",
                                        isActive
                                            ? "text-foreground bg-white shadow-sm ring-1 ring-gray-200 dark:bg-zinc-800 dark:ring-zinc-700"
                                            : "text-gray-500 hover:text-foreground hover:bg-gray-100/50 dark:hover:bg-zinc-800/30"
                                    )}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-md hidden md:block">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                                <Menu className="h-4 w-4" /> {/* Swap with search icon if preferred */}
                            </div>
                            <input
                                type="text"
                                placeholder="Enter your search request..."
                                className="block w-full bg-white dark:bg-zinc-800/50 border-none rounded-full py-2.5 pl-11 pr-4 text-sm shadow-xs ring-1 ring-gray-200 dark:ring-zinc-700 focus:ring-2 focus:ring-primary focus:bg-white transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 pr-4 border-r border-gray-200 dark:border-zinc-800">
                            <ThemeToggle />
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="/dashboard/profile" className="flex items-center gap-3 p-1 rounded-full hover:bg-white dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-gray-200 dark:hover:border-zinc-700">
                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-zinc-700">
                                    {user?.name?.[0] || <UserIcon className="h-5 w-5 text-gray-400" />}
                                </div>
                                <div className="hidden xl:block pr-2">
                                    <p className="text-xs font-bold text-foreground leading-tight">{user?.name || 'Administrator'}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">{user?.role || 'Staff Management'}</p>
                                </div>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                                title="Log out"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-(--breakpoint-2xl) p-6 lg:p-8">
                {children}
            </main>
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden font-sans">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setSidebarOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white dark:bg-zinc-900 shadow-2xl p-6 flex flex-col gap-8 animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between">
                            <span className="text-xl font-bold tracking-tight text-foreground">Menu</span>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Mobile Nav Links */}
                        <div className="flex-1 space-y-2">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-3 text-base font-semibold rounded-2xl transition-all duration-200",
                                            isActive
                                                ? "text-white bg-primary shadow-lg shadow-primary/20"
                                                : "text-gray-500 hover:text-foreground hover:bg-gray-100 dark:hover:bg-zinc-800"
                                        )}
                                    >
                                        <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400 group-hover:text-primary")} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Mobile User Profile */}
                        <div className="border-t border-gray-100 dark:border-zinc-800 pt-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-zinc-700">
                                    {user?.name?.[0] || <UserIcon className="h-6 w-6 text-gray-400" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">{user?.name || 'Administrator'}</p>
                                    <p className="text-xs text-gray-400 font-medium">{user?.role || 'Staff Management'}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                            >
                                <LogOut className="h-5 w-5" />
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
