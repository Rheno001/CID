'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Staff, Role, Department, Branch } from '@/app/types';
import { cn } from '@/lib/utils';
import { lookupApi, staffApi, branchApi } from '@/lib/api';
import { Loader2, User, Mail, Briefcase, Building, Phone, Calendar, MapPin, Camera, MessageSquare } from 'lucide-react';
import { useEffect } from 'react';

interface StaffFormProps {
    initialData?: Staff;
    isEdit?: boolean;
}

export default function StaffForm({ initialData, isEdit = false }: StaffFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [formData, setFormData] = useState<Partial<Staff>>({
        name: initialData?.name || '',
        email: initialData?.email || '',
        role: initialData?.role || '',
        department_id: (typeof initialData?.department === 'object' && initialData.department !== null) ? (initialData.department as any)._id : '',
        branch_id: initialData?.branch_id || '',
        phone: initialData?.phone || '',
        dob: initialData?.dob || '',
        address: initialData?.address || '',
        profile_picture: initialData?.profile_picture || '',
        reports_to: initialData?.reports_to || 'ME_QC',
        password: '',
    });

    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [rolesData, departmentsData, branchesData] = await Promise.all([
                    lookupApi.getRoles(),
                    lookupApi.getDepartments(),
                    branchApi.getAll()
                ]);

                // Normalize roles
                const rawRoles = Array.isArray(rolesData) ? rolesData : (rolesData as any).data || (rolesData as any).roles || [];
                const normalizedRoles = rawRoles.map((r: any, idx: number) => {
                    if (typeof r === 'string') return { _id: r, name: r };
                    return {
                        _id: r._id || r.id || `role-${r.name || idx}`,
                        name: r.name || String(r)
                    };
                });
                setRoles(normalizedRoles);

                // Normalize departments
                const rawDepts = Array.isArray(departmentsData) ? departmentsData : (departmentsData as any).data || (departmentsData as any).departments || [];
                const normalizedDepts = rawDepts.map((d: any, idx: number) => {
                    if (typeof d === 'string') return { _id: d, name: d };
                    return {
                        _id: d._id || d.id || `dept-${d.name || idx}`,
                        name: d.name || String(d)
                    };
                });
                setDepartments(normalizedDepts);

                setBranches(branchesData);

            } catch (err) {
                console.error('Failed to fetch lookup data:', err);
            }
        };

        fetchLookups();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const staffId = initialData?._id || initialData?.id;

            // Transform data for the register endpoint
            const payload = {
                ...formData,
                department_id: formData.department_id,
            };

            if (isEdit && staffId) {
                await staffApi.update(staffId, payload);
            } else {
                await staffApi.create(payload);
            }

            router.push('/dashboard/staff');
            router.refresh();
        } catch (error) {
            console.error('Failed to save staff:', error);
            setError('Failed to save staff member. Please ensure all fields are correct.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, profile_picture: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-white dark:bg-zinc-900 p-10 rounded-4xl border border-gray-100 dark:border-zinc-800 shadow-sm animate-in fade-in duration-700">
            <div className="space-y-8">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <User className="h-3 w-3" /> Profile Information
                    </h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Legal Full Name</label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. John Doe"
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-gray-50/50 dark:bg-zinc-800 ring-1 ring-inset ring-gray-100 dark:ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Primary Email Address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-gray-50/50 dark:bg-zinc-800 ring-1 ring-inset ring-gray-100 dark:ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="dob" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Date of Birth</label>
                            <input
                                id="dob"
                                name="dob"
                                type="date"
                                value={formData.dob}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-gray-50/50 dark:bg-zinc-800 ring-1 ring-inset ring-gray-100 dark:ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Legal Address</label>
                            <textarea
                                id="address"
                                name="address"
                                rows={3}
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter full residential address"
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-gray-50/50 dark:bg-zinc-800 ring-1 ring-inset ring-gray-100 dark:ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="profile_picture" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Profile Picture</label>
                            <div className="flex items-center gap-4">
                                {formData.profile_picture ? (
                                    <img
                                        src={formData.profile_picture}
                                        alt="Preview"
                                        className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary/20"
                                    />
                                ) : (
                                    <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
                                        <Camera className="h-6 w-6" />
                                    </div>
                                )}
                                <input
                                    id="profile_picture"
                                    name="profile_picture"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-primary file:text-white hover:file:bg-primary/90 transition-all"
                                />
                            </div>
                        </div>

                        {!isEdit && (
                            <div className="sm:col-span-2">
                                <label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Account Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required={!isEdit}
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-gray-50/50 dark:bg-zinc-800 ring-1 ring-inset ring-gray-100 dark:ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <Briefcase className="h-3 w-3" /> Organizational Details
                    </h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Position / Job Title</label>
                            <select
                                id="role"
                                name="role"
                                required
                                value={formData.role}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-gray-50/50 dark:bg-zinc-800 ring-1 ring-inset ring-gray-100 dark:ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                <option key="role-placeholder" value="" disabled>Select Role</option>
                                {roles.length > 0 ? (
                                    roles.map(r => (
                                        <option key={r._id} value={r.name}>{r.name}</option>
                                    ))
                                ) : (
                                    <option key="role-loading" value={formData.role}>{formData.role || 'Loading roles...'}</option>
                                )}
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="branch_id" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Assigned Branch</label>
                            <select
                                id="branch_id"
                                name="branch_id"
                                required
                                value={formData.branch_id}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-gray-50/50 dark:bg-zinc-800 ring-1 ring-inset ring-gray-100 dark:ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                <option key="branch-placeholder" value="" disabled>Select Branch</option>
                                {branches.length > 0 ? (
                                    branches.map(b => (
                                        <option key={b._id} value={b._id}>{b.name}</option>
                                    ))
                                ) : (
                                    <option key="branch-loading" value="">Loading branches...</option>
                                )}
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="department_id" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Assigned Department</label>
                            <select
                                id="department_id"
                                name="department_id"
                                required
                                value={formData.department_id}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-gray-50/50 dark:bg-zinc-800 ring-1 ring-inset ring-gray-100 dark:ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                <option key="dept-placeholder" value="" disabled>Select Department</option>
                                {departments.length > 0 ? (
                                    departments.map(d => (
                                        <option key={d._id} value={d._id}>{d.name}</option>
                                    ))
                                ) : (
                                    <option key="dept-loading" value="">Loading departments...</option>
                                )}
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Contact Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+234 ..."
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-gray-50/50 dark:bg-zinc-800 ring-1 ring-inset ring-gray-100 dark:ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 flex items-start gap-4">
                <div className="h-10 w-10 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-primary shrink-0">
                    <MessageSquare className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notice</p>
                    <p className="text-xs text-gray-500 font-bold leading-relaxed">Updates to staff profiles are permanent and logged for auditing purposes. Ensure information is accurate before submission.</p>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600 border border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/20">
                    {error}
                </div>
            )}

            <div className="flex items-center justify-end gap-6 pt-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-foreground transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-2xl bg-primary px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        isEdit ? 'Update Staff Profile' : 'Register New Staff Member'
                    )}
                </button>
            </div>
        </form>
    );
}
