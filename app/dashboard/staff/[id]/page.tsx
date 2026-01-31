'use client';

import { use } from 'react'; // React 19 hook for unwrapping params
import StaffForm from '@/components/StaffForm';
import { Staff } from '@/app/types';

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    // Mock data lookup
    const mockStaff: Staff[] = [
        { _id: '1', name: 'John Doe', email: 'john@example.com', role: 'Manager', department: 'Sales', status: 'active', createdAt: '2023-01-01' },
        { _id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Developer', department: 'Engineering', status: 'inactive', createdAt: '2023-02-15' },
        { _id: '3', name: 'Robert Johnson', email: 'robert@example.com', role: 'Designer', department: 'Marketing', status: 'active', createdAt: '2023-03-10' },
        { _id: '4', name: 'Emily Davis', email: 'emily@example.com', role: 'HR Specialist', department: 'Human Resources', status: 'active', createdAt: '2023-04-05' },
    ];

    const staff = mockStaff.find(s => s._id === id) || null;

    if (!staff) {
        return (
            <div className="p-4 text-center text-red-600">
                Staff member not found
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
