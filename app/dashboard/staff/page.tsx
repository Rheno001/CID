'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Staff } from '@/app/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StaffPage() {
    const [staff, setStaff] = useState<Staff[]>([
        { _id: '1', name: 'John Doe', email: 'john@example.com', role: 'Manager', department: 'Sales', status: 'active', createdAt: '2023-01-01' },
        { _id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Developer', department: 'Engineering', status: 'inactive', createdAt: '2023-02-15' },
        { _id: '3', name: 'Robert Johnson', email: 'robert@example.com', role: 'Designer', department: 'Marketing', status: 'active', createdAt: '2023-03-10' },
        { _id: '4', name: 'Emily Davis', email: 'emily@example.com', role: 'HR Specialist', department: 'Human Resources', status: 'active', createdAt: '2023-04-05' },
    ]);


    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this staff member?')) return;
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
                    className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                    Add Staff
                </Link>
            </div>


            <div className="overflow-hidden bg-white shadow sm:rounded-md dark:bg-zinc-800">
                <ul role="list" className="divide-y divide-gray-200 dark:divide-zinc-700">
                    {staff.map((person) => (
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
                                                    className="bg-white p-2 text-gray-400 hover:text-gray-500 dark:bg-zinc-800 dark:text-gray-400 dark:hover:text-gray-300 border-r border-gray-300 dark:border-zinc-700"
                                                >
                                                    <span className="sr-only">Edit</span>
                                                    <Pencil className="h-5 w-5" />
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
        </div>
    );
}
