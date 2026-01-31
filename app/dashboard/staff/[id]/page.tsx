'use client';

import { use, useState, useEffect } from 'react'; // React 19 hook for unwrapping params
import StaffForm from '@/components/StaffForm';
import { Staff } from '@/app/types';
import { staffApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [staff, setStaff] = useState<Staff | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const data = await staffApi.getById(id);
                setStaff(data);
            } catch (err) {
                console.error('Failed to fetch staff detail:', err);
                setError('Staff member not found or error fetching details.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStaff();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        );
    }

    if (error || !staff) {
        return (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <div className="flex">
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                            {error || 'Staff member not found'}
                        </h3>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">Edit Staff</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update details for {staff.name}.</p>
            </div>

            <StaffForm initialData={staff} isEdit={true} />
        </div>
    );
}
