'use client';

import { useState, useEffect } from 'react';
import { Appraisal } from '@/app/types';
import { appraisalApi } from '@/lib/api';
import { Loader2, Download, Calendar, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface AppraisalsViewProps {
    userId: string;
}

export default function AppraisalsView({ userId }: AppraisalsViewProps) {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Ensure month is 0-padded for API consistency if needed, though most APIs handle both
                const m = month.toString().padStart(2, '0');
                const data = await appraisalApi.getMonthly(userId, m, year);
                setAppraisals(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load appraisals');
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, [userId, month, year]);

    const handleDownload = () => {
        if (!appraisals.length) return;

        const data = appraisals.map(a => ({
            Date: new Date(a.date).toLocaleDateString(),
            Score: a.score,
            MaxScore: a.maxScore || '-',
            Comment: a.comment || '-',
            Evaluator: typeof a.evaluator === 'object' ? a.evaluator?.name : a.evaluator || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Appraisals ${month}-${year}`);
        XLSX.writeFile(wb, `Appraisals_${userId}_${month}_${year}.xlsx`);
    };

    // Calculate average score
    const avgScore = appraisals.length
        ? (appraisals.reduce((acc, curr) => acc + curr.score, 0) / appraisals.length).toFixed(1)
        : 0;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-4xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="px-8 py-8 flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-orange-50 dark:bg-orange-900/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight">Monthly Appraisals</h2>
                        {appraisals.length > 0 && (
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                Avg Score: <span className="text-orange-600 dark:text-orange-400">{avgScore}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="h-10 rounded-xl border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-bold focus:ring-orange-500 focus:border-orange-500 cursor-pointer pl-3 pr-8"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'short' })}</option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="h-10 rounded-xl border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-bold focus:ring-orange-500 focus:border-orange-500 cursor-pointer pl-3 pr-8"
                    >
                        {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i + 1).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleDownload}
                        disabled={!appraisals.length}
                        className="h-10 flex items-center gap-2 px-4 rounded-xl bg-orange-600 text-white text-xs font-black uppercase tracking-wide hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-600/20"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export XLSX</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-x-auto min-h-[300px]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-zinc-800/30">
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">Date</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">Score</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Feedback / Comment</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right w-40">Evaluator</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-32 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading appraisals...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-24 text-center">
                                    <div className="inline-flex p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 mb-3">
                                        <TrendingUp className="h-6 w-6 text-red-500" />
                                    </div>
                                    <p className="text-sm font-bold text-red-500">{error}</p>
                                </td>
                            </tr>
                        ) : appraisals.length > 0 ? (
                            appraisals.map((appraisal) => (
                                <tr key={appraisal._id} className="group hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-all">
                                    <td className="px-8 py-6 text-sm font-bold text-foreground">
                                        {new Date(appraisal.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "inline-flex items-center justify-center h-8 w-8 rounded-xl text-xs font-black ring-1 ring-inset shadow-sm",
                                                appraisal.score >= 8 ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400" :
                                                    appraisal.score >= 5 ? "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/30 dark:text-orange-400" :
                                                        "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400"
                                            )}>
                                                {appraisal.score}
                                            </span>
                                            {appraisal.maxScore && <span className="text-[10px] text-gray-400 font-bold">/ {appraisal.maxScore}</span>}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-gray-600 dark:text-gray-300 font-medium max-w-sm truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:bg-white dark:group-hover:bg-zinc-900 group-hover:shadow-lg group-hover:z-10 transition-all rounded-lg">
                                        {appraisal.comment || appraisal.rating || '—'}
                                    </td>
                                    <td className="px-8 py-6 text-xs font-bold text-gray-400 text-right uppercase tracking-wider">
                                        {typeof appraisal.evaluator === 'object' ? appraisal.evaluator?.name : appraisal.evaluator || '—'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-8 py-24 text-center">
                                    <div className="inline-flex p-4 rounded-3xl bg-gray-50 dark:bg-zinc-800 mb-4">
                                        <Calendar className="h-8 w-8 text-gray-200" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-400">No appraisals recorded for {new Date(0, month - 1).toLocaleString('default', { month: 'long' })} {year}.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
