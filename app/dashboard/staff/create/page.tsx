import StaffForm from '@/components/StaffForm';

export default function CreateStaffPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Add New Staff</h1>
                <p className="mt-1 text-sm text-gray-500">Fill in the details to create a new staff member.</p>
            </div>

            <StaffForm />
        </div>
    );
}
