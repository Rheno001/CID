'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Staff } from '@/app/types';
import { staffApi } from '@/lib/api';
import { Plus, Pencil, Trash2, Loader2, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StaffPage() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const data = await staffApi.getAll();
                // Defensive check: if response is an object with a data property that is an array
                if (Array.isArray(data)) {
                    setStaff(data);
                } else if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
                    setStaff((data as any).data);
                } else if (data && typeof data === 'object' && Array.isArray((data as any).users)) {
                    setStaff((data as any).users);
                } else {
                    console.error('Unexpected staff data format:', data);
                    setStaff([]);
                }
            } catch (err) {
                console.error('Failed to fetch staff:', err);
                setError('Failed to load staff members. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStaff();
    }, []);


    const handleDelete = (staffId: string) => {
        if (!confirm('Are you sure you want to delete this staff member? (Local UI only, pending backend support)')) return;
        if (!Array.isArray(staff)) return;
        setStaff(staff.filter((s) => (s._id || s.id) !== staffId));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Staff Management</h1>
                    <p className="mt-1 text-gray-500 text-sm">Manage your team members, departments and their operational roles.</p>
                </div>
                <Link
                    href="/dashboard/staff/create"
                    className="inline-flex items-center gap-x-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                >
                    <Plus className="h-5 w-5" />
                    Add Staff Member
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="rounded-3xl bg-red-50 p-6 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30">
                    <div className="flex gap-3">
                        <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5" />
                        <h3 className="text-sm font-bold text-red-800 dark:text-red-200">{error}</h3>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-4xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
                    <ul role="list" className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {Array.isArray(staff) && staff.map((person) => {
                            const personId = person._id || person.id || '';
                            const deptName = (typeof person.department === 'object' && person.department !== null)
                                ? (person.department as any).name
                                : (person.department || 'General');

                            return (
                                <li key={personId} className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-zinc-800/50">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-6 lg:px-8">

                                        <Link
                                            href={`/dashboard/staff/view/${personId}`}
                                            className="flex items-center gap-4 flex-1 cursor-pointer"
                                        >
                                            <div className="h-14 w-14 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-primary font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
                                                {person.name[0]}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">{person.name}</h4>
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-inset uppercase tracking-wider",
                                                        person.status === 'active'
                                                            ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400"
                                                            : "bg-gray-50 text-gray-500 ring-gray-400/20 dark:bg-zinc-800 dark:text-gray-400"
                                                    )}>
                                                        {person.status}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 items-center text-xs text-gray-400 font-medium">
                                                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {deptName}</span>
                                                    <span className="flex items-center gap-1.5"><Plus className="h-3 w-3" /> {person.role}</span>
                                                    <span className="hidden sm:inline text-gray-200">|</span>
                                                    <span className="truncate">{person.email}</span>
                                                </div>
                                            </div>
                                        </Link>

                                        <div className="flex items-center gap-2 sm:ml-auto">
                                            <Link
                                                href={`/dashboard/staff/view/${personId}`}
                                                className="p-3 rounded-2xl bg-gray-50 text-orange-600 hover:bg-orange-600 hover:text-white dark:bg-zinc-800 dark:hover:bg-orange-600 transition-all shadow-sm"
                                                title="View History"
                                            >
                                                <Clock className="h-5 w-5" />
                                            </Link>
                                            <Link
                                                href={`/dashboard/staff/${personId}`}
                                                className="p-3 rounded-2xl bg-gray-50 text-gray-500 hover:bg-zinc-800 hover:text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all shadow-sm"
                                                title="Edit Profile"
                                            >
                                                <Pencil className="h-5 w-5" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(personId)}
                                                className="p-3 rounded-2xl bg-gray-50 text-red-400 hover:bg-red-500 hover:text-white dark:bg-zinc-800 dark:hover:bg-red-600 transition-all shadow-sm"
                                                title="Delete Record"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                        {staff.length === 0 && (
                            <li className="px-6 py-20 text-center">
                                <div className="inline-flex p-4 rounded-3xl bg-gray-50 dark:bg-zinc-800 mb-4">
                                    <Users className="h-10 w-10 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">No team members yet</h3>
                                <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">Get started by adding your first staff member to the platform.</p>
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
