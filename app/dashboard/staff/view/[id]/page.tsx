'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { Staff, AttendanceRecord } from '@/app/types';
import { staffApi, attendanceApi } from '@/lib/api';
import { 
    Loader2, 
    Mail, 
    Phone, 
    ChevronLeft, 
    Plus, 
    TrendingUp, 
    LogIn, 
    LogOut,
    ShieldAlert,
    ExternalLink,
    Building2,
    CalendarDays,
    Info,
    CheckCircle2,
    XCircle,
    MapPin,
    Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import AppraisalsView from '@/components/AppraisalsView';
import Modal from '@/components/Modal';

export default function StaffViewPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [staff, setStaff] = useState<Staff | null>(null);
    const [attendanceDataRaw, setAttendanceDataRaw] = useState<any>(null);
    const [appraisals, setAppraisals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAppraisalsOpen, setIsAppraisalsOpen] = useState(false);
    const [isOverrideOpen, setIsOverrideOpen] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');
    const [clockLoading, setClockLoading] = useState<'in' | 'out' | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

    const fetchStaffAndAttendance = useCallback(async () => {
        try {
            const now = new Date();
            const [staffData, attData, appraisalData] = await Promise.all([
                staffApi.getById(id),
                attendanceApi.getByStaffId(id),
                require('@/lib/api').appraisalApi.getMonthly(id, now.getMonth() + 1, now.getFullYear())
            ]);

            setStaff(staffData);
            setAttendanceDataRaw(attData);
            setAppraisals(Array.isArray(appraisalData) ? appraisalData : []);
        } catch (err) {
            console.error('Failed to fetch staff details:', err);
            setError('Failed to load profile. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchStaffAndAttendance();
    }, [fetchStaffAndAttendance]);

    const handleClock = async (action: 'in' | 'out') => {
        if (!staff) return;

        if (action === 'in' && staff.role?.toUpperCase() === 'CEO') {
            setStatusMessage({ 
                type: 'info', 
                text: 'Backend Limitation: The CEO is exempted from the attendance system and cannot be clocked in.' 
            });
            return;
        }

        setClockLoading(action);
        setStatusMessage(null);
        try {
            let res: any;
            if (action === 'in') {
                if (overrideReason.trim()) {
                    res = await attendanceApi.adminClockInUser(id, overrideReason);
                    setIsOverrideOpen(false);
                    setOverrideReason('');
                } else {
                    res = await attendanceApi.clockIn(id);
                }
            } else {
                res = await attendanceApi.clockOut(id);
            }

            const successText = res?.message || (action === 'in' ? 'Successfully clocked in.' : 'Successfully clocked out.');
            setStatusMessage({ type: 'success', text: successText });
            
            await fetchStaffAndAttendance();
        } catch (err: any) {
            console.error('Clock error:', err);
            const msg = err?.response?.data?.message || err?.message || 'Action failed. Please try again.';
            setStatusMessage({ type: 'error', text: msg });
        } finally {
            setClockLoading(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Loading Personnel File...</p>
            </div>
        );
    }

    if (error || !staff) {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-8 bg-zinc-900 rounded-4xl border border-zinc-800 text-center space-y-6">
                <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                <h3 className="text-xl font-black text-foreground">{error || 'Staff record not found'}</h3>
                <Link href="/dashboard/staff" className="inline-flex items-center text-sm font-bold text-primary hover:underline">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Return to Staff Management
                </Link>
            </div>
        );
    }

    let presentDays = 0;
    if (attendanceDataRaw?.userMetrics && Array.isArray(attendanceDataRaw.userMetrics)) {
        const myMetric = attendanceDataRaw.userMetrics.find((m: any) => m.userId === id);
        if (myMetric) {
            presentDays = (myMetric.presentDays || 0) + (myMetric.lateDays || 0);
        }
    }

    const staffId = staff.id || staff._id || '';
    const isCEO = staff.role?.toUpperCase() === 'CEO';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Actions Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/staff" className="group">
                        <div className="p-3 rounded-2xl bg-zinc-950/50 border border-zinc-900 group-hover:bg-zinc-900 transition-all">
                            <ChevronLeft className="h-5 w-5 text-gray-400 group-hover:text-white" />
                        </div>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Personnel Profile</h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">ID: #{staffId.slice(0, 8)}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {!isCEO && (
                        <>
                            <button 
                                onClick={() => setIsOverrideOpen(true)}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500/5 text-amber-500 hover:bg-amber-500/10 transition-all text-sm font-black uppercase tracking-tight"
                            >
                                <ShieldAlert className="h-4 w-4" />
                                Override
                            </button>
                            
                            <button 
                                onClick={() => handleClock('in')}
                                disabled={clockLoading !== null}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-green-600/90 text-white text-sm font-black hover:bg-green-600 active:scale-95 disabled:opacity-50 transition-all"
                            >
                                {clockLoading === 'in' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                                Clock In
                            </button>

                            <button 
                                onClick={() => handleClock('out')}
                                disabled={clockLoading !== null}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600/90 text-white text-sm font-black hover:bg-red-600 active:scale-95 disabled:opacity-50 transition-all"
                            >
                                {clockLoading === 'out' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                                Clock Out
                            </button>
                        </>
                    )}
                    
                    {isCEO && (
                        <div className="px-5 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-black text-primary uppercase tracking-widest">
                            Exempt Account
                        </div>
                    )}
                </div>
            </div>

            {/* Status Message */}
            {statusMessage && (
                <div className={cn(
                    "p-4 rounded-3xl border flex items-center justify-between bg-zinc-900 border-zinc-800 animate-in zoom-in-95 duration-300",
                    statusMessage.type === 'success' ? "border-green-500/20" : 
                    statusMessage.type === 'info' ? "border-primary/20" : "border-red-500/20"
                )}>
                    <div className="flex items-center gap-4 px-2">
                        {statusMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
                         statusMessage.type === 'info' ? <Info className="h-5 w-5 text-primary" /> : <XCircle className="h-5 w-5 text-red-500" />}
                        <span className={cn(
                            "text-sm font-bold",
                            statusMessage.type === 'success' ? "text-green-400" :
                            statusMessage.type === 'info' ? "text-primary" : "text-red-400"
                        )}>{statusMessage.text}</span>
                    </div>
                    <button onClick={() => setStatusMessage(null)} className="text-xs font-black text-gray-500 hover:text-white mr-2">DISMISS</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Identity Card */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-zinc-900/40 rounded-4xl border border-zinc-900 overflow-hidden backdrop-blur-md">
                        <div className="h-28 relative">
                             {/* Removed Gradient in Profile Header */}
                             <div className="absolute inset-x-0 bottom-0 h-px bg-zinc-800/50" />
                        </div>
                        <div className="px-8 pb-10 -mt-14 relative text-center">
                            <div className="inline-block p-1.5 bg-zinc-950 rounded-[2.5rem] mb-6 shadow-2xl">
                                <div className="h-28 w-28 rounded-[2rem] bg-zinc-900 flex items-center justify-center text-primary font-black text-5xl overflow-hidden shadow-inner">
                                    {(staff.profile_pic_url || staff.profile_picture) ? (
                                        <img 
                                            src={(staff.profile_pic_url || staff.profile_picture) as string} 
                                            alt={staff.name || 'Profile'} 
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        staff.name?.[0].toUpperCase()
                                    )}
                                </div>
                            </div>
                            <h2 className="text-3xl font-black text-foreground leading-tight">{staff.name}</h2>
                            <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mt-2">{staff.role}</p>
                            
                            <div className="mt-10 space-y-5 text-left bg-zinc-950/30 p-6 rounded-3xl border border-zinc-900/50">
                                <div className="flex items-center gap-4 group">
                                    <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-gray-600 group-hover:text-primary transition-colors border border-zinc-800">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Email</p>
                                        <p className="text-sm font-bold text-gray-300 truncate">{staff.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-gray-600 group-hover:text-primary transition-colors border border-zinc-800">
                                        <Smartphone className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Phone</p>
                                        <p className="text-sm font-bold text-gray-300">{staff.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-gray-600 group-hover:text-primary transition-colors border border-zinc-800">
                                        <Building2 className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Dept.</p>
                                        <p className="text-sm font-bold text-gray-300">
                                            {typeof staff.department === 'string' ? staff.department : (staff.department as any)?.name || 'General'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Link 
                                href={`/dashboard/staff/${id}`}
                                className="w-full mt-8 flex items-center justify-center gap-2 py-4 rounded-3xl bg-zinc-900 text-sm font-black text-gray-400 hover:text-white hover:bg-zinc-800 transition-all border border-zinc-800"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Edit Account
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900/60 p-6 rounded-4xl border border-zinc-900">
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Attendance</p>
                            <p className="text-4xl font-black text-foreground mt-2">{presentDays}</p>
                            <p className="text-[10px] font-bold text-green-500 mt-1 uppercase tracking-tighter">Days Present</p>
                        </div>
                        <div className="bg-zinc-900/60 p-6 rounded-4xl border border-zinc-900">
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Leave Bal.</p>
                            <p className="text-4xl font-black text-foreground mt-2">{staff.leave_balance || 0}</p>
                            <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-tighter">Total Credits</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsAppraisalsOpen(true)}
                        className="w-full flex items-center justify-between p-7 rounded-[2.5rem] bg-zinc-900/50 hover:bg-zinc-900 transition-all border border-zinc-800 group"
                    >
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform border border-primary/20">
                                <TrendingUp className="h-7 w-7" />
                            </div>
                            <div className="text-left">
                                <p className="text-xl font-black text-foreground leading-none">Internal Review</p>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-2">Appraisals & Reports</p>
                            </div>
                        </div>
                        <ChevronLeft className="h-5 w-5 text-primary rotate-180" />
                    </button>
                </div>

                {/* Right: History Timeline */}
                <div className="lg:col-span-8 flex flex-col gap-8 h-full">
                    <div className="bg-zinc-900/40 rounded-4xl border border-zinc-900 flex-1 flex flex-col overflow-hidden backdrop-blur-sm">
                        <div className="p-8 flex items-center justify-between border-b border-zinc-900">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-primary border border-zinc-800">
                                    <CalendarDays className="h-6 w-6" />
                                </div>
                                <h3 className="text-2xl font-black text-foreground tracking-tight">Activity Log</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    {appraisals.length} Total Entries
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto min-h-[500px]">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-950/20">
                                    <tr>
                                        <th className="px-10 py-5 text-[11px] font-black text-gray-600 uppercase tracking-[0.1em]">Event Date</th>
                                        <th className="px-10 py-5 text-[11px] font-black text-gray-600 uppercase tracking-[0.1em]">Workplace</th>
                                        <th className="px-10 py-5 text-[11px] font-black text-gray-600 uppercase tracking-[0.1em]">Achievements</th>
                                        <th className="px-10 py-5 text-[11px] font-black text-gray-600 uppercase tracking-[0.1em] text-right">Certification</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900">
                                    {appraisals.length > 0 ? (
                                        [...appraisals].sort((a,b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).map((rec, i) => {
                                            const isSigned = !!rec.signature_url;
                                            return (
                                                <tr key={rec.id || i} className="group hover:bg-zinc-950/30 transition-colors">
                                                    <td className="px-10 py-7">
                                                        <div className="flex flex-col">
                                                            <span className="text-base font-black text-foreground">
                                                                {rec.date ? new Date(rec.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-7">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-black text-gray-400 tracking-tight capitalize">{rec.workplace || 'Office'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-7 max-w-[200px]">
                                                         <p className="text-sm font-bold text-gray-400 truncate">{rec.achievements}</p>
                                                    </td>
                                                    <td className="px-10 py-7 text-right">
                                                         { isSigned ? 
                                                            <div className="flex items-center justify-end gap-2">
                                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                                <span className="text-green-500 text-xs font-bold uppercase tracking-widest">Signed</span>
                                                            </div>
                                                            : 
                                                            <div className="flex items-center justify-end gap-2">
                                                                <XCircle className="h-4 w-4 text-amber-500" />
                                                                <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">Unvouched</span>
                                                            </div>
                                                         }
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-32 text-center">
                                                <div className="inline-block p-6 rounded-[2rem] bg-zinc-950/40 mb-6">
                                                    <Info className="h-10 w-10 text-zinc-800" />
                                                </div>
                                                <p className="text-sm font-black text-gray-600 uppercase tracking-[0.2em]">Zero Activity Signals Detected</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 flex items-center gap-8 group">
                        <div className="h-16 w-16 rounded-3xl bg-zinc-950 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform border border-zinc-800">
                            <Info className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-xl font-black text-foreground tracking-tight">Security & Governance Notice</h4>
                            <p className="text-sm text-gray-500 leading-relaxed font-bold">
                                Manual overrides are subject to immediate audit. The URNI Governor tracks all point-based performance variations across departments.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Appraisals Modal */}
            <Modal isOpen={isAppraisalsOpen} onClose={() => setIsAppraisalsOpen(false)}>
                <AppraisalsView userId={id} userName={staff?.name} />
            </Modal>

            {/* Manual Override Modal */}
            <Modal isOpen={isOverrideOpen} onClose={() => { setIsOverrideOpen(false); setOverrideReason(''); }}>
                <div className="p-10 space-y-8 bg-zinc-950/80 backdrop-blur-xl">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-[2rem] bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                            <ShieldAlert className="h-9 w-9" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-foreground tracking-tight leading-none">Force Entry</h2>
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-2">Administrative Attendance Override</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Override Justification</label>
                        <textarea 
                            required
                            rows={4}
                            placeholder="State the categorical reason for this manual entry..."
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-base font-bold text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all resize-none shadow-2xl"
                        />
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button 
                            onClick={() => { setIsOverrideOpen(false); setOverrideReason(''); }}
                            className="flex-1 py-5 bg-zinc-900 hover:bg-zinc-800 text-gray-500 font-black rounded-3xl transition-all uppercase tracking-widest text-xs"
                        >
                            Abort
                        </button>
                        <button 
                            onClick={() => handleClock('in')}
                            disabled={!overrideReason.trim() || clockLoading !== null}
                            className="flex-1 py-5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-3xl shadow-2xl shadow-amber-900/40 disabled:opacity-50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                        >
                             {clockLoading === 'in' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldAlert className="h-5 w-5" />}
                             Confirm Entry
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
