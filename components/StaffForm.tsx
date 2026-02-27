'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Staff, Role, Department, Branch, Company } from '@/app/types';
import { cn } from '@/lib/utils';
import api, { lookupApi, staffApi, branchApi, companyApi } from '@/lib/api';
import { Loader2, User, Mail, Briefcase, Building, Phone, Calendar, MapPin, Camera, MessageSquare, Users } from 'lucide-react';
import { useEffect } from 'react';

interface StaffFormProps {
    initialData?: Staff;
    isEdit?: boolean;
}

export default function StaffForm({ initialData, isEdit = false }: StaffFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const [error, setError] = useState('');
    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [allStaff, setAllStaff] = useState<Staff[]>([]);
    const [formData, setFormData] = useState<Partial<Staff>>({
        name: initialData?.name || '',
        email: initialData?.email || '',
        role: initialData?.role || '',
        company_id: initialData?.company_id || '',
        department_id: (typeof initialData?.department === 'object' && initialData.department !== null) ? (initialData.department as any)._id : '',
        branch_id: initialData?.branch_id || '',
        phone: initialData?.phone || '',
        dob: initialData?.dob || '',
        address: initialData?.address || '',
        profile_picture: initialData?.profile_picture || '',
        reports_to: initialData?.reports_to || '',
        password: '',
        staff_id: initialData?.staff_id || '',
        leave_balance: initialData?.leave_balance ?? 20,
        stats_score: initialData?.stats_score ?? 100,
        is_active: initialData?.is_active ?? true,
        employment_type: initialData?.employment_type || undefined,
    });

    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [deptsRes, branchesRes, companiesRes, staffRes] = await Promise.all([
                    api.get('api/departments'),
                    api.get('api/branches'),
                    api.get('api/companies'),
                    api.get('api/users/staff').catch(() => ({ data: [] }))
                ]);

                const departmentsData = deptsRes.data;
                const branchesData = branchesRes.data;
                const companiesData = companiesRes.data;
                const staffData = staffRes.data;

                const extractArray = (d: any, keys = ['branches', 'companies', 'departments', 'roles', 'users', 'staff', 'data', 'results', 'items']): any[] => {
                    if (Array.isArray(d)) return d;
                    if (!d || typeof d !== 'object') return [];
                    // Check top-level array keys
                    for (const k of keys) {
                        if (Array.isArray(d[k])) return d[k];
                    }
                    // One level deeper string
                    if (d.data && typeof d.data === 'object' && !Array.isArray(d.data)) {
                        for (const k of keys) {
                            if (Array.isArray(d.data[k])) return d.data[k];
                        }
                    }
                    return [];
                };

                // Normalize departments
                const rawDepts = extractArray(departmentsData);
                const normalizedDepts = rawDepts.map((d: any, idx: number) => {
                    if (typeof d === 'string') return { _id: d, name: d };
                    return {
                        _id: d._id || d.id || `dept-${d.name || idx}`,
                        name: d.name || String(d)
                    };
                });
                setDepartments(normalizedDepts);

                // Normalize branches
                const rawBranches = extractArray(branchesData);
                const normalizedBranches = rawBranches.map((b: any, idx: number) => ({
                    ...b,
                    _id: b._id || b.id || `branch-${idx}`
                }));
                setBranches(normalizedBranches);

                // Normalize companies
                const rawCompanies = extractArray(companiesData);
                const normalizedCompanies = rawCompanies.map((c: any, idx: number) => ({
                    ...c,
                    _id: c._id || c.id || `company-${idx}`
                }));
                setCompanies(normalizedCompanies);

                // Normalize staff for "Reports To" lookup
                const rawStaff = extractArray(staffData);
                const normalizedStaff = rawStaff.map((s: any) => ({
                    ...s,
                    _id: s._id || s.id,
                })).filter((s: any) => s._id);
                setAllStaff(normalizedStaff);

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

            const formPayload = new FormData();
            formPayload.append('name', formData.name || '');
            formPayload.append('email', formData.email || '');
            formPayload.append('role', formData.role || '');
            formPayload.append('position', formData.employment_type || '');
            if (formData.phone) formPayload.append('phone', formData.phone);
            if (formData.address) formPayload.append('address', formData.address);
            if (formData.dob) formPayload.append('dob', formData.dob);
            if (formData.company_id) formPayload.append('company_id', formData.company_id);
            if (formData.department_id) formPayload.append('department_id', formData.department_id);
            if (formData.branch_id) formPayload.append('branch_id', formData.branch_id);
            if (formData.reports_to) formPayload.append('reports_to_id', formData.reports_to);

            formPayload.append('stats_score', String(formData.stats_score ?? 100));
            formPayload.append('leave_balance', String(formData.leave_balance ?? 20));
            formPayload.append('is_active', String(formData.is_active ?? true));
            if (formData.staff_id) formPayload.append('staff_id', formData.staff_id);

            // Attach the actual compressed File object
            if (formData.profile_picture && formData.profile_picture instanceof File) {
                formPayload.append('profile_pic', formData.profile_picture);
            }

            // ONLY send password for new registrations
            if (!isEdit && formData.password) {
                formPayload.append('password', formData.password);
            }

            // Identification field for updates
            if (isEdit && staffId) {
                formPayload.append('id', staffId);
            }

            console.log('REGISTER PAYLOAD (FormData Keys):', Array.from(formPayload.keys()));

            if (isEdit && staffId) {
                const response = await staffApi.update(staffId, formPayload as any);
                console.log('Update Success:', response);
            } else {
                const response = await staffApi.create(formPayload as any);
                console.log('Registration Success:', response);
            }

            router.push('/dashboard/staff');
            router.refresh();
        } catch (error: any) {
            console.error('API Error:', error);
            console.error('Axios error data:', error.response?.data);
            console.error('Axios error status:', error.response?.status);

            if (error.response?.status === 413) {
                setError('The profile picture is too large. Please use a smaller image (under 1MB).');
            } else if (error.response?.data?.message) {
                setError(`Failed: ${error.response.data.message}`);
            } else {
                setError('Failed to save staff member. Please check details and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    const MAX_SIZE = 1024;
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress as JPEG with 0.7 quality to a Blob
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                                type: 'image/jpeg'
                            });
                            resolve(newFile);
                        } else {
                            reject(new Error("Canvas to Blob failed"));
                        }
                    }, 'image/jpeg', 0.7);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setCompressing(true);
                setError('');
                const compressedFile = await compressImage(file);
                // Store the File object directly in the form state instead of a URL
                setFormData({ ...formData, profile_picture: compressedFile as any });
            } catch (err) {
                console.error('Compression failed:', err);
                setError('Failed to process image. Please try another one.');
            } finally {
                setCompressing(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-zinc-900 p-10 rounded-4xl border border-zinc-800 shadow-sm animate-in fade-in duration-700">
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
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+234 ..."
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="dob" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Date of Birth</label>
                            <input
                                id="dob"
                                name="dob"
                                type="date"
                                required
                                value={formData.dob}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Legal Address</label>
                            <textarea
                                id="address"
                                name="address"
                                rows={3}
                                required
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter full residential address"
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="profile_picture" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Profile Picture</label>
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-zinc-800 border-zinc-700 flex items-center justify-center overflow-hidden">
                                    {compressing ? (
                                        <div className="flex flex-col items-center justify-center gap-1">
                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            <span className="text-[8px] font-bold text-gray-400">Processing...</span>
                                        </div>
                                    ) : formData.profile_picture ? (
                                        <img
                                            src={formData.profile_picture instanceof File ? URL.createObjectURL(formData.profile_picture) : formData.profile_picture}
                                            alt="Preview"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-6 w-6 text-gray-400" />
                                    )}
                                </div>
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
                                    className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                            <label htmlFor="company_id" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Company</label>
                            <select
                                id="company_id"
                                name="company_id"
                                required
                                value={formData.company_id || ''}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                <option key="company-placeholder" value="" disabled>Select Company</option>
                                {companies.length > 0 ? (
                                    companies.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))
                                ) : (
                                    <option key="company-loading" value="">Loading companies...</option>
                                )}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Position / Job Title</label>
                            <select
                                id="role"
                                name="role"
                                required
                                value={formData.role}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                <option value="" disabled>Select Role</option>
                                <option value="HOD">HOD</option>
                                <option value="Assistant HOD">Assistant HOD</option>
                                <option value="General Staff">General Staff</option>
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="employment_type" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Employment Position / Status</label>
                            <select
                                id="employment_type"
                                name="employment_type"
                                required
                                value={formData.employment_type || ''}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                <option value="" disabled>Select Position</option>
                                <option value="FULLTIME">Full Time</option>
                                <option value="INTERN">Intern</option>
                                <option value="CONTRACT">Contract Staff</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="department_id" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Department</label>
                            <select
                                id="department_id"
                                name="department_id"
                                required
                                value={formData.department_id || ''}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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

                        <div>
                            <label htmlFor="branch_id" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Branch</label>
                            <select
                                id="branch_id"
                                name="branch_id"
                                required
                                value={formData.branch_id || ''}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                            <label htmlFor="reports_to" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Reports To</label>
                            <select
                                id="reports_to"
                                name="reports_to"
                                value={formData.reports_to || ''}
                                onChange={handleChange}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                <option key="reports-placeholder" value="">None (Top Level)</option>
                                {allStaff.length > 0 ? (
                                    allStaff
                                        // Filter out the current staff member when editing to prevent self-reporting
                                        .filter(s => s._id !== initialData?._id && s._id !== initialData?.id)
                                        .map(s => (
                                            <option key={s._id} value={s._id}>{s.name} ({s.role || 'Staff'})</option>
                                        ))
                                ) : (
                                    <option key="reports-loading" value="" disabled>Loading staff members...</option>
                                )}
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <Users className="h-3 w-3" /> System Fields
                    </h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div>
                            <label htmlFor="staff_id" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Staff ID</label>
                            <input
                                type="text"
                                name="staff_id"
                                id="staff_id"
                                value={formData.staff_id}
                                onChange={handleChange}
                                disabled={!isEdit}
                                placeholder="Auto-generated"
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label htmlFor="leave_balance" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Leave Balance</label>
                            <input
                                type="number"
                                name="leave_balance"
                                id="leave_balance"
                                value={formData.leave_balance}
                                onChange={handleChange}
                                min="0"
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="stats_score" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Stats Score</label>
                            <input
                                type="number"
                                name="stats_score"
                                id="stats_score"
                                value={formData.stats_score}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="is_active" className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Account Status</label>
                            <select
                                id="is_active"
                                name="is_active"
                                value={formData.is_active ? 'true' : 'false'}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                                className="block w-full rounded-2xl border-0 py-3.5 px-4 text-sm font-bold text-foreground bg-zinc-800 ring-zinc-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-800/50 p-6 rounded-3xl border border-zinc-800 flex items-start gap-4">
                <div className="h-10 w-10 rounded-2xl bg-zinc-800 shadow-sm flex items-center justify-center text-primary shrink-0">
                    <MessageSquare className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notice</p>
                    <p className="text-xs text-gray-500 font-bold leading-relaxed">
                        {!isEdit ? (
                            <>New staff will have default values: <strong>leave_balance: 20</strong> and <strong>stats_score: 100</strong>. The <strong>staff_id</strong> will be auto-generated by the system after creation. You can adjust leave balance and stats score before submitting.</>
                        ) : (
                            <>Updates to staff profiles are permanent and logged for auditing purposes. Ensure information is accurate before submission.</>
                        )}
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl p-4 font-bold border bg-red-900/10 text-red-400 border-red-900/20">
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
