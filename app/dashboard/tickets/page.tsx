'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ticket, Staff } from '@/app/types';
import { ticketApi, staffApi } from '@/lib/api';
import { 
    Loader2, 
    Ticket as TicketIcon, 
    Plus, 
    ShieldAlert, 
    CheckCircle2, 
    AlertCircle, 
    User, 
    MessageSquare, 
    Clock, 
    Search,
    Filter,
    ChevronRight,
    Flag,
    Trash2,
    Eye,
    XCircle,
    CheckSquare,
    Image as ImageIcon,
    Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Modal from '@/components/Modal';

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isIssuing, setIsIssuing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<{ id: string, role: string } | null>(null);

    // Filters & Tabs
    const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [severityFilter, setSeverityFilter] = useState<string>('ALL');

    // Detail & Action State
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isResponding, setIsResponding] = useState(false);
    const [respondAction, setRespondAction] = useState<'ACKNOWLEDGE' | 'CONTEST' | 'RESOLVE' | 'VOID' | null>(null);
    const [contestNote, setContestNote] = useState('');
    const [contestImage, setContestImage] = useState<File | null>(null);

    // Form State for New Ticket
    const [newTicket, setNewTicket] = useState({
        title: '',
        description: '',
        severity: 1,
        target_user_id: '',
        is_anonymous: false
    });

    const fetchData = useCallback(async () => {
        try {
            const [ticketsRes, staffData] = await Promise.all([
                ticketApi.getAll(1, 100),
                staffApi.getAll()
            ]);

            setTickets(Array.isArray(ticketsRes) ? ticketsRes : (ticketsRes as any)?.data || []);
            setStaff(Array.isArray(staffData) ? staffData : []);
        } catch (err) {
            console.error('Failed to fetch tickets or staff:', err);
            setError('Could not load data. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Get user from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setCurrentUser({ id: user.id || user._id, role: user.role });
                // If not admin/CEO, default to 'my' tickets
                const isManagement = ['CEO', 'MD', 'ADMIN', 'HR'].includes(user.role?.toUpperCase());
                if (!isManagement) {
                    setActiveTab('my');
                }
            } catch (e) {
                console.error('Failed to parse user from localStorage');
            }
        }
        fetchData();
    }, [fetchData]);

    const handleIssueTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsIssuing(true);
        setError(null);
        try {
            const ticketToSubmit = {
                ...newTicket,
                is_anonymous: !canIssueNonAnon ? true : newTicket.is_anonymous
            };
            await ticketApi.create(ticketToSubmit);
            await fetchData();
            setNewTicket({
                title: '',
                description: '',
                severity: 1,
                target_user_id: '',
                is_anonymous: false
            });
            alert('Ticket issued successfully!');
        } catch (err: any) {
            console.error('Failed to issue ticket:', err);
            setError(err.response?.data?.message || 'Failed to issue ticket. Please try again.');
        } finally {
            setIsIssuing(false);
        }
    };

    const handleRespond = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket || !respondAction) return;
        
        setIsResponding(true);
        try {
            await ticketApi.respond(selectedTicket.id, {
                action: respondAction,
                contest_note: respondAction === 'CONTEST' ? contestNote : undefined,
                contest_image: respondAction === 'CONTEST' ? (contestImage || undefined) : undefined
            });
            await fetchData();
            setSelectedTicket(null);
            setRespondAction(null);
            setContestNote('');
            setContestImage(null);
            alert(`Ticket processed as ${respondAction}`);
        } catch (err: any) {
            console.error('Failed to respond to ticket:', err);
            alert(err.response?.data?.message || 'Failed to process response.');
        } finally {
            setIsResponding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this ticket?')) return;
        try {
            await ticketApi.delete(id);
            await fetchData();
            if (selectedTicket?.id === id) setSelectedTicket(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete ticket.');
        }
    };

    // Filter Logic
    const isManagement = currentUser && ['CEO', 'MD', 'ADMIN', 'HR', 'DEPARTMENT_HEAD', 'ASST_DEPARTMENT_HEAD'].includes(currentUser.role?.toUpperCase());
    const canIssueNonAnon = isManagement;
    
    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             t.target_user?.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
        const matchesSeverity = severityFilter === 'ALL' || t.severity === parseInt(severityFilter);
        const matchesTab = activeTab === 'all' || t.target_user_id === currentUser?.id;
        
        return matchesSearch && matchesStatus && matchesSeverity && matchesTab;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">System Tickets</h1>
                    <p className="text-gray-500 text-sm mt-1">Issue and manage official warnings or status tickets for staff members.</p>
                </div>
                {isManagement && (
                    <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-2xl shadow-sm">
                        <button 
                            onClick={() => setActiveTab('all')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                                activeTab === 'all' ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-gray-200"
                            )}
                        >
                            Organization
                        </button>
                        <button 
                            onClick={() => setActiveTab('my')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                                activeTab === 'my' ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-gray-200"
                            )}
                        >
                            Assigned to Me
                        </button>
                    </div>
                )}
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search tickets, descriptions, or users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-600"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <select 
                            title="Filter by status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl px-10 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none min-w-[140px]"
                        >
                            <option value="ALL">All Status</option>
                            <option value="OPEN">Open</option>
                            <option value="CONTESTED">Contested</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="VOIDED">Voided</option>
                        </select>
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <div className="relative">
                        <select 
                            title="Filter by severity"
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl px-10 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none min-w-[140px]"
                        >
                            <option value="ALL">All Severity</option>
                            <option value="1">Low</option>
                            <option value="5">Medium</option>
                            <option value="10">High</option>
                            <option value="20">Critical</option>
                        </select>
                        <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Tickets List */}
                <div className="lg:col-span-8 space-y-4">
                    {filteredTickets.length > 0 ? (
                        filteredTickets.map((ticket) => (
                            <div 
                                key={ticket.id} 
                                onClick={() => setSelectedTicket(ticket)}
                                className={cn(
                                    "bg-zinc-900 rounded-3xl p-6 border transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] group",
                                    selectedTicket?.id === ticket.id ? "border-primary shadow-lg shadow-primary/5" : "border-zinc-800 hover:border-zinc-700"
                                )}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                                            ticket.status === 'RESOLVED' ? "bg-green-500/10 text-green-500" :
                                            ticket.status === 'CONTESTED' ? "bg-orange-500/10 text-orange-500" :
                                            ticket.status === 'VOIDED' ? "bg-zinc-800 text-gray-500" :
                                            ticket.severity >= 4 ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                                        )}>
                                            {ticket.status === 'RESOLVED' ? <CheckCircle2 className="h-6 w-6" /> : 
                                             ticket.status === 'CONTESTED' ? <Flag className="h-6 w-6" /> :
                                             <AlertCircle className="h-6 w-6" />}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{ticket.title}</h3>
                                                <span className={cn(
                                                    "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                                                    ticket.severity >= 4 ? "bg-red-500/20 text-red-500" :
                                                    ticket.severity >= 3 ? "bg-orange-500/20 text-orange-500" :
                                                    "bg-blue-500/20 text-blue-500"
                                                )}>
                                                    SVR {ticket.severity}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 line-clamp-1">{ticket.description}</p>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                                    <User className="h-3 w-3" />
                                                    {ticket.target_user?.name || 'Unknown'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(ticket.created_at).toLocaleDateString()}
                                                </div>
                                                {ticket.is_anonymous ? (
                                                     <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 italic">
                                                        <ShieldAlert className="h-3 w-3" />
                                                        Anonymous
                                                    </div>
                                                ) : ticket.issuer && (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                                        <User className="h-3 w-3" />
                                                        From: {ticket.issuer.name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3 shrink-0">
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                            ticket.status === 'OPEN' ? "bg-red-500/10 text-red-500" : 
                                            ticket.status === 'RESOLVED' ? "bg-green-500/10 text-green-500" :
                                            ticket.status === 'CONTESTED' ? "bg-orange-500/10 text-orange-500" :
                                            "bg-zinc-800 text-gray-400"
                                        )}>
                                            {ticket.status}
                                        </span>
                                        <ChevronRight className="h-5 w-5 text-gray-700 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-zinc-900 rounded-4xl p-20 text-center space-y-4 border border-zinc-800 border-dashed">
                            <div className="h-16 w-16 bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto">
                                <TicketIcon className="h-8 w-8 text-gray-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-400">No tickets matching your filters</h3>
                            <button 
                                onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setSeverityFilter('ALL'); }}
                                className="text-primary font-bold text-sm hover:underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Side: Form or Details */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Selected Ticket Details */}
                    {selectedTicket ? (
                        <div className="bg-zinc-900 rounded-4xl p-8 border border-primary shadow-2xl shadow-primary/5 space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black tracking-tight text-foreground">Ticket Details</h2>
                                <button onClick={() => setSelectedTicket(null)} className="text-gray-500 hover:text-white" title="Close details">
                                    <XCircle className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-zinc-800/50 space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Subject</p>
                                    <p className="font-bold text-foreground text-lg">{selectedTicket.title}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-zinc-800/50 space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Reason / Description</p>
                                    <p className="text-sm text-gray-300 leading-relaxed font-medium">{selectedTicket.description}</p>
                                </div>

                                {selectedTicket.contest_note && (
                                    <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Contest Note</p>
                                        <p className="text-sm text-orange-200 leading-relaxed font-medium italic">"{selectedTicket.contest_note}"</p>
                                    </div>
                                )}

                                {selectedTicket.contest_image && (
                                    <div className="p-4 rounded-2xl bg-zinc-800/50 space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Evidence Image</p>
                                        <img 
                                            src={selectedTicket.contest_image} 
                                            alt="Contest Evidence" 
                                            className="w-full rounded-xl border border-zinc-700 shadow-sm"
                                        />
                                    </div>
                                )}

                                {/* Role based actions */}
                                <div className="pt-4 space-y-3">
                                    {selectedTicket.status === 'OPEN' && selectedTicket.target_user_id === currentUser?.id && (
                                        <>
                                            <button 
                                                onClick={() => { setRespondAction('ACKNOWLEDGE'); }}
                                                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02] active:scale-95"
                                            >
                                                <CheckSquare className="h-5 w-5" />
                                                Acknowledge Fault
                                            </button>
                                            <button 
                                                onClick={() => { setRespondAction('CONTEST'); }}
                                                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-orange-900/20 transition-all hover:scale-[1.02] active:scale-95"
                                            >
                                                <Flag className="h-5 w-5" />
                                                Contest Ticket
                                            </button>
                                        </>
                                    )}

                                    {isManagement && (selectedTicket.status === 'OPEN' || selectedTicket.status === 'CONTESTED') && (
                                        <>
                                            <button 
                                                onClick={() => { setRespondAction('RESOLVE'); }}
                                                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                                            >
                                                <ShieldAlert className="h-5 w-5" />
                                                Uphold (Resolve)
                                            </button>
                                            <button 
                                                onClick={() => { setRespondAction('VOID'); }}
                                                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white font-bold py-3 rounded-2xl transition-all"
                                            >
                                                <XCircle className="h-5 w-5" />
                                                Void / Dismiss
                                            </button>
                                        </>
                                    )}

                                    {isManagement && (
                                        <button 
                                            onClick={() => handleDelete(selectedTicket.id)}
                                            className="w-full flex items-center justify-center gap-2 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white font-bold py-3 rounded-2xl transition-all"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                            Delete Permanently
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Issue New Ticket Form */
                        <div className="bg-zinc-900 rounded-4xl p-8 border border-zinc-800 shadow-xl space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Plus className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight text-foreground">Issue Ticket</h2>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">New Disciplinary Action</p>
                                    </div>
                                </div>
                                {!canIssueNonAnon && (
                                    <span className="text-[10px] font-black bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full uppercase tracking-tighter">
                                        Anonymous Only
                                    </span>
                                )}
                            </div>

                            <form onSubmit={handleIssueTicket} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Staff Member</label>
                                    <select 
                                        required
                                        title="Select staff member"
                                        value={newTicket.target_user_id}
                                        onChange={(e) => setNewTicket({ ...newTicket, target_user_id: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-white font-bold"
                                    >
                                        <option value="" disabled>Select staff member</option>
                                        {staff.map(s => (
                                            <option key={s.id || s._id} value={s.id || s._id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Title</label>
                                    <input 
                                        required
                                        type="text"
                                        placeholder="e.g. Repeated Tardiness"
                                        value={newTicket.title}
                                        onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-white"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Description</label>
                                    <textarea 
                                        required
                                        rows={3}
                                        placeholder="Detailed reason for the ticket..."
                                        value={newTicket.description}
                                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-white resize-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Severity Level</label>
                                    <div className="flex gap-2">
                                        {[
                                            { val: 1, label: 'Low' },
                                            { val: 5, label: 'Med' },
                                            { val: 10, label: 'High' },
                                            { val: 20, label: 'Crit' }
                                        ].map((lvl) => (
                                            <button 
                                                key={lvl.val}
                                                type="button"
                                                onClick={() => setNewTicket({ ...newTicket, severity: lvl.val })}
                                                className={cn(
                                                    "flex-1 h-10 rounded-xl font-black transition-all text-[10px] uppercase tracking-tighter",
                                                    newTicket.severity === lvl.val ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-zinc-800 text-gray-500"
                                                )}
                                            >
                                                {lvl.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {canIssueNonAnon ? (
                                    <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-2xl">
                                        <input 
                                            type="checkbox" 
                                            id="anon"
                                            checked={newTicket.is_anonymous}
                                            onChange={(e) => setNewTicket({ ...newTicket, is_anonymous: e.target.checked })}
                                            className="h-4 w-4 bg-zinc-700 border-zinc-600 rounded text-primary focus:ring-primary"
                                        />
                                        <label htmlFor="anon" className="text-xs font-bold text-gray-400 cursor-pointer">Issue anonymously</label>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                        <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-1">Whistleblower Protection</p>
                                        <p className="text-[11px] text-gray-500 font-medium leading-tight">
                                            As General Staff, your report will be submitted anonymously to Management for review.
                                        </p>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isIssuing}
                                    onClick={() => {
                                        if (!canIssueNonAnon) {
                                            setNewTicket(prev => ({ ...prev, is_anonymous: true }));
                                        }
                                    }}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                                >
                                    {isIssuing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldAlert className="h-5 w-5" />}
                                    {canIssueNonAnon ? 'Issue Ticket' : 'Submit Anonymous Report'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Respond/Action Modals */}
            <Modal 
                isOpen={!!respondAction} 
                onClose={() => { setRespondAction(null); setContestNote(''); setContestImage(null); }}
                className="max-w-xl"
            >
                <form onSubmit={handleRespond} className="p-8 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg",
                            respondAction === 'ACKNOWLEDGE' || respondAction === 'RESOLVE' ? "bg-green-600 text-white shadow-green-900/20" :
                            respondAction === 'CONTEST' ? "bg-orange-600 text-white shadow-orange-900/20" :
                            "bg-zinc-700 text-white"
                        )}>
                             {respondAction === 'ACKNOWLEDGE' || respondAction === 'RESOLVE' ? <CheckCircle2 className="h-6 w-6" /> : 
                              respondAction === 'CONTEST' ? <Flag className="h-6 w-6" /> :
                              <XCircle className="h-6 w-6" />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-foreground">
                                {respondAction === 'ACKNOWLEDGE' ? 'Acknowledge Fault' :
                                 respondAction === 'CONTEST' ? 'Contest this Ticket' :
                                 respondAction === 'RESOLVE' ? 'Uphold Ticket' : 'Void Ticket'}
                            </h2>
                            <p className="text-sm text-gray-500 font-bold">Please confirm your decision below.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700">
                            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Selected Ticket</p>
                            <p className="font-bold text-lg text-foreground">{selectedTicket?.title}</p>
                            <p className="text-xs text-primary font-black mt-1">Severity: {selectedTicket?.severity}</p>
                        </div>

                        {respondAction === 'CONTEST' && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Provide Evidence / Reason</label>
                                    <textarea 
                                        required
                                        rows={4}
                                        placeholder="Explain why you are contesting this ticket..."
                                        value={contestNote}
                                        onChange={(e) => setContestNote(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-white resize-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Attached Image (Evidence)</label>
                                    <div className="relative group cursor-pointer">
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            title="Upload evidence image"
                                            onChange={(e) => setContestImage(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                        />
                                        <div className={cn(
                                            "w-full h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all",
                                            contestImage ? "border-primary bg-primary/5" : "border-zinc-800 hover:border-zinc-700 bg-zinc-800/20"
                                        )}>
                                            {contestImage ? (
                                                <div className="flex items-center gap-2 text-primary">
                                                    <ImageIcon className="h-5 w-5" />
                                                    <span className="text-xs font-bold truncate max-w-[200px]">{contestImage.name}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="h-6 w-6 text-gray-600 mb-1" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Select Image File</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <p className="text-xs text-gray-500 font-medium leading-relaxed italic py-1">
                            {respondAction === 'ACKNOWLEDGE' ? 'Acknowledging will accept the point deduction on your staff record immediately.' :
                             respondAction === 'CONTEST' ? 'Management will review your evidence and either uphold or void the ticket.' :
                             respondAction === 'RESOLVE' ? 'Resolving will finalize the ticket and apply any penalties to the staff member.' :
                             'Voiding will remove any pending status and close the ticket without penalties.'}
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            type="button"
                            onClick={() => { setRespondAction(null); setContestNote(''); setContestImage(null); }}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white font-bold py-4 rounded-2xl transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isResponding}
                            className={cn(
                                "flex-1 text-white font-black py-4 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2",
                                respondAction === 'ACKNOWLEDGE' || respondAction === 'RESOLVE' ? "bg-green-600 shadow-green-900/20" :
                                respondAction === 'CONTEST' ? "bg-orange-600 shadow-orange-900/20" :
                                "bg-zinc-700 shadow-zinc-900/20"
                            )}
                        >
                            {isResponding ? <Loader2 className="h-5 w-5 animate-spin" /> : 
                             respondAction === 'ACKNOWLEDGE' ? 'Confirm Acknowledge' :
                             respondAction === 'CONTEST' ? 'Submit Contest' :
                             respondAction === 'RESOLVE' ? 'Confirm Uphold' : 'Confirm Void'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

