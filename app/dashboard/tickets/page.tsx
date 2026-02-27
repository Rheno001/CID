'use client';

import { useState, useEffect } from 'react';
import { Ticket, Staff } from '@/app/types';
import { ticketApi, staffApi } from '@/lib/api';
import { Loader2, Ticket as TicketIcon, Plus, ShieldAlert, CheckCircle2, AlertCircle, User, MessageSquare, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isIssuing, setIsIssuing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [newTicket, setNewTicket] = useState({
        title: '',
        description: '',
        severity: 1,
        target_user_id: '',
        status: 'OPEN' as const
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ticketsData, staffData] = await Promise.all([
                    ticketApi.getAll(),
                    staffApi.getAll()
                ]);

                // Handle possible nested data structures
                const normalizedTickets = Array.isArray(ticketsData) ? ticketsData :
                    (ticketsData as any).data || (ticketsData as any).tickets || [];
                const normalizedStaff = Array.isArray(staffData) ? staffData :
                    (staffData as any).data || (staffData as any).users || [];

                setTickets(normalizedTickets);
                setStaff(normalizedStaff);
            } catch (err) {
                console.error('Failed to fetch tickets or staff:', err);
                setError('Could not load data. Please check your connection.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleIssueTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsIssuing(true);
        setError(null);
        try {
            const res = await ticketApi.create({
                ...newTicket,
                created_at: new Date().toISOString()
            });

            // Refresh tickets
            const ticketsData = await ticketApi.getAll();
            setTickets(Array.isArray(ticketsData) ? ticketsData : (ticketsData as any).data || []);

            // Reset form
            setNewTicket({
                title: '',
                description: '',
                severity: 1,
                target_user_id: '',
                status: 'OPEN'
            });
            alert('Ticket issued successfully!');
        } catch (err) {
            console.error('Failed to issue ticket:', err);
            setError('Failed to issue ticket. Please try again.');
        } finally {
            setIsIssuing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">System Tickets</h1>
                    <p className="text-gray-500 text-sm mt-1">Issue and manage official warnings or status tickets for staff members.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: List (8/12) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-zinc-900 rounded-4xl shadow-sm border border-zinc-800 overflow-hidden min-h-[400px]">
                        <div className="px-8 py-6 border-zinc-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <TicketIcon className="h-5 w-5 text-primary" />
                                Active Tickets
                            </h2>
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-zinc-800 px-3 py-1 rounded-full">
                                {tickets.length} Total
                            </span>
                        </div>

                        <div className="divide-zinc-800">
                            {tickets.length > 0 ? (
                                [...tickets].reverse().map((ticket) => {
                                    const targetUser = staff.find(s => (s._id || s.id) === ticket.target_user_id);
                                    return (
                                        <div key={ticket.id} className="p-8 hover:bg-gray-50/50 transition-colors group">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-5">
                                                    <div className={cn(
                                                        "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm",
                                                        ticket.severity >= 3 ? "bg-red-50 text-red-500" :
                                                            ticket.severity === 2 ? "bg-orange-50 text-orange-500" :
                                                                "bg-blue-50 text-blue-500"
                                                    )}>
                                                        {ticket.status === 'OPEN' ? <AlertCircle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{ticket.title}</h3>
                                                        <p className="text-sm text-gray-500">{ticket.description}</p>
                                                        <div className="flex items-center gap-4 pt-2">
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                                                <User className="h-3 w-3" />
                                                                {targetUser?.name || 'Unknown User'}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                                                <Clock className="h-3 w-3" />
                                                                {new Date(ticket.created_at).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                                        ticket.status === 'OPEN' ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                                                    )}>
                                                        {ticket.status}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-300">#{ticket.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-20 text-center space-y-4">
                                    <div className="h-16 w-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto">
                                        <TicketIcon className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-400">No tickets found in the system.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Issue Ticket (4/12) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-zinc-900 rounded-4xl p-8 shadow-2xl text-white">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <Plus className="h-6 w-6" />
                            </div>
                            <h2 className="text-xl font-black tracking-tight">Issue New Ticket</h2>
                        </div>

                        <form onSubmit={handleIssueTicket} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Staff Member</label>
                                <select
                                    required
                                    value={newTicket.target_user_id}
                                    onChange={(e) => setNewTicket({ ...newTicket, target_user_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-600"
                                >
                                    <option key="staff-placeholder" value="" disabled className="text-zinc-900">Select staff member</option>
                                    {staff.map((s) => (
                                        <option key={s._id || s.id} value={s._id || s.id} className="text-zinc-900 italic font-bold">
                                            {s.name} ({s.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Ticket Title</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Late Arrival Warning"
                                    value={newTicket.title}
                                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Describe the reason for this ticket..."
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Severity Level</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((lvl) => (
                                        <button
                                            key={lvl}
                                            type="button"
                                            onClick={() => setNewTicket({ ...newTicket, severity: lvl })}
                                            className={cn(
                                                "flex-1 h-10 rounded-xl font-black text-xs transition-all",
                                                newTicket.severity === lvl ? "bg-primary text-white shadow-lg scale-105" : "bg-white/5 text-gray-400 hover:bg-white/10"
                                            )}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <p className="text-xs text-red-400 font-bold bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isIssuing}
                                className="w-full bg-primary py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {isIssuing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldAlert className="h-5 w-5" />}
                                Issue Official Ticket
                            </button>
                        </form>
                    </div>

                    <div className="bg-zinc-900 p-8 rounded-4xl border border-zinc-800 space-y-4">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notice</h4>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed font-bold">
                            Tickets are official records of staff performance or conduct. Once issued, they are permanent parts of the staff history profile.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
