'use client';

import { useState, useEffect } from 'react';
import { Staff } from '@/app/types';
import { staffApi } from '@/lib/api';
import { Loader2, Mail, Phone, Briefcase, Building, ShieldCheck, MailCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
    const [profile, setProfile] = useState<Staff | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await staffApi.getMe();
                console.log('Profile data fetched:', data);

                // Defensive check: handle nested data property
                if (data && typeof data === 'object' && (data as any).data) {
                    setProfile((data as any).data);
                } else if (data && typeof data === 'object' && (data as any).user) {
                    setProfile((data as any).user);
                } else {
                    setProfile(data);
                }

                if (data && typeof data === 'object') {
                    const p = (data as any).data || (data as any).user || data;
                    console.log('Department type check:', typeof p.department, p.department);
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
                setError('Failed to load profile details.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="max-w-2xl mx-auto mt-10">
                <div className="rounded-md p-4 bg-red-900/20">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="font-medium text-red-200">
                                {error || 'Profile not found'}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="font-bold text-white">Your Profile</h1>
                <p className="mt-2 text-gray-400">View and manage your personal account details.</p>
            </div>

            <div className="overflow-hidden shadow-xl sm:rounded-2xl bg-zinc-900 border border-zinc-800">
                {/* Header/Cover aspect */}
                <div className="h-32 bg-linear-to-r from-orange-500 to-amber-500" />

                <div className="relative px-6 pb-8 sm:px-10">
                    <div className="relative -mt-12 flex items-end gap-x-6">
                        <div className="h-24 w-24 rounded-2xl p-1 shadow-lg bg-zinc-800">
                            <div className="h-full w-full rounded-xl bg-orange-900/30 flex items-center justify-center text-orange-400 font-bold">
                                {profile?.name?.[0]}
                            </div>
                        </div>
                        <div className="mb-1 flex-1">
                            <h2 className="font-bold text-white leading-7">{profile?.name || 'User'}</h2>
                            <p className="font-medium text-gray-400">
                                {profile?.role || 'Access Level Not Set'} • {
                                    (typeof profile?.department === 'object' && profile?.department !== null)
                                        ? (profile.department as any).name
                                        : (profile?.department || 'No Department Assigned')
                                }
                            </p>
                        </div>
                        <div className="mb-1">
                            <span className={cn(
                                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
                                profile?.status === 'active'
                                    ? "ring-green-600/20 bg-green-900/30 text-green-400"
                                    : "ring-gray-500/10 bg-gray-900/30 text-gray-400"
                            )}>
                                {profile?.status ? profile.status.toUpperCase() : "UNKNOWN"}
                            </span>
                        </div>
                    </div>

                    <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
                        <div className="space-y-6">
                            <h3 className="font-semibold text-white border-zinc-800 pb-2">Contact Information</h3>

                            <div className="flex items-center gap-x-4">
                                <div className="rounded-lg p-2 bg-zinc-800">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-400 uppercase tracking-wider">Email Address</p>
                                    <p className="font-semibold text-white">{profile?.email || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-x-4">
                                <div className="rounded-lg p-2 bg-zinc-800">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-400 uppercase tracking-wider">Phone Number</p>
                                    <p className="font-semibold text-white">{profile.phone || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="font-semibold text-white border-zinc-800 pb-2">Employment Details</h3>

                            <div className="flex items-center gap-x-4">
                                <div className="rounded-lg p-2 bg-zinc-800">
                                    <Building className="h-5 w-5 text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-400 uppercase tracking-wider">Department</p>
                                    <p className="font-semibold text-white">
                                        {(typeof profile?.department === 'object' && profile?.department !== null)
                                            ? (profile.department as any).name
                                            : (profile?.department || (['Admin', 'CEO', 'ME_QC'].includes(profile?.role || '') ? 'Administration' : 'Not assigned'))}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-x-4">
                                <div className="rounded-lg p-2 bg-zinc-800">
                                    <Briefcase className="h-5 w-5 text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-400 uppercase tracking-wider">Designation / Role</p>
                                    <p className="font-semibold text-white">{profile?.role || 'Not set'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 p-6 rounded-xl bg-orange-900/10 border border-orange-900/20">
                        <div className="flex items-start gap-4">
                            <ShieldCheck className="h-6 w-6 text-orange-400 mt-1" />
                            <div>
                                <h4 className="font-bold text-orange-100">Account Verified</h4>
                                <p className="text-orange-300 mt-1">Your account is fully verified and you have access to the administrative dashboard features based on your role.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
