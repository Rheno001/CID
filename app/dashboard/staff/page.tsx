'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Staff } from '@/app/types';
import { staffApi } from '@/lib/api';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
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


    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this staff member?')) return;
        if (!Array.isArray(staff)) return;
        setStaff(staff.filter((s) => s._id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">Staff Management</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your team members and their roles.</p>
                </div>
                <Link
                    href="/dashboard/staff/create"
                    className="inline-flex items-center gap-x-2 rounded-md bg-orange-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                >
                    <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                    Add Staff
                </Link>
            </div>


            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                </div>
            ) : error ? (
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden bg-white shadow sm:rounded-md dark:bg-zinc-800">
                    <ul role="list" className="divide-y divide-gray-200 dark:divide-zinc-700">
                        {Array.isArray(staff) && staff.map((person) => (
                            <li key={person._id}>
                                <div className="block hover:bg-gray-50 dark:hover:bg-zinc-700/50">
                                    <div className="flex items-center px-4 py-4 sm:px-6">
                                        <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div className="truncate">
                                                <div className="flex text-sm">
                                                    <p className="truncate font-medium text-indigo-600 dark:text-indigo-400">{person.name}</p>
                                                    <p className="ml-1 flex-shrink-0 font-normal text-gray-500 dark:text-gray-400">in {person.department}</p>
                                                </div>
                                                <div className="mt-2 flex">
                                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                        <p>
                                                            {person.email} • {person.role}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex-shrink-0 sm:ml-5 sm:mt-0">
                                                <div className="flex overflow-hidden rounded-md border border-gray-300 dark:border-zinc-700">
                                                    <Link
                                                        href={`/dashboard/staff/${person._id}`}
                                                        className="rounded bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-zinc-700 dark:text-gray-200 dark:ring-zinc-600 dark:hover:bg-zinc-600"
                                                    >
                                                        <Pencil className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                        <span className="sr-only">Edit</span>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(person._id)}
                                                        className="bg-white p-2 text-red-400 hover:text-red-500 dark:bg-zinc-800 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        <span className="sr-only">Delete</span>
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-5 flex-shrink-0">
                                            <span className={cn(
                                                "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                person.status === 'active'
                                                    ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-400/20"
                                                    : "bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-400/20"
                                            )}>
                                                {person.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {staff.length === 0 && (
                            <li className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                No staff members found.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
