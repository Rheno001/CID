'use client';

import { useState, useEffect, useMemo } from 'react';
import { Appraisal, Staff } from '@/app/types';
import { appraisalApi, staffApi, companyApi, departmentApi, getImageUrl } from '@/lib/api';
import { Loader2, Download, Calendar, TrendingUp, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import {
    AlignmentType,
    Document,
    HeadingLevel,
    ImageRun,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";
import { saveAs } from 'file-saver';
import { cn } from '@/lib/utils';

const getImageBuffer = async (url: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.arrayBuffer();
    } catch (error) {
        console.error("Failed to get image buffer:", error);
        return null;
    }
};

const getBase64 = async (url: string) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                resolve(base64String.split(',')[1]);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Failed to get base64:", error);
        return null;
    }
};

interface AppraisalsViewProps {
    userId: string;
    userName?: string;
}

export default function AppraisalsView({ userId, userName }: AppraisalsViewProps) {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await staffApi.getById(userId);
                if (!data) return;

                let deptHeadName = "";
                let deptHeadSignature = "";
                let mdName = "";
                let mdSignature = "";

                const departmentId = data.department_id || (typeof data.department === "object" ? data.department?._id || data.department?.id : null);
                if (departmentId) {
                    try {
                        const dept = await departmentApi.getById(departmentId);
                        if (dept && dept.head_id) {
                            const head = await staffApi.getById(dept.head_id);
                            if (head) {
                                deptHeadName = head.name;
                                deptHeadSignature = head.profile_pic_url || ""; // Assuming signature is stored there or somewhere accessible
                            }
                        }
                    } catch (e) { console.error("Dept head fetch failed", e); }
                }

                const companyId = data.company_id || (typeof data.company === "object" ? data.company?._id || data.company?.id : null);
                if (companyId) {
                    try {
                        const employees = await companyApi.getEmployees(companyId);
                        const md = employees.find(e => e.role?.toUpperCase() === 'MD' || e.role?.toUpperCase() === 'CEO');
                        if (md) {
                            mdName = md.name;
                            mdSignature = md.profile_pic_url || "";
                        }
                    } catch (e) { console.error("MD fetch failed", e); }
                }

                setUserInfo({
                    name: data.name,
                    department: typeof data.department === 'string' ? data.department : data.department?.name || 'N/A',
                    company: typeof data.company === 'object' ? data.company?.name : 'TBG',
                    signature_url: data.profile_pic_url, // Fallback for signature
                    deptHeadName,
                    deptHeadSignature,
                    mdName,
                    mdSignature
                });
            } catch (err) {
                console.error("Failed to fetch user data", err);
            }
        };

        const fetch = async () => {
            setIsLoading(true);
            setError(null);
            try {
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
        fetchUserData();
    }, [userId, month, year]);

    const exportToExcel = async () => {
        if (isExporting || !appraisals.length) return;
        setIsExporting(true);
        try {
            const daysInMonth = new Date(year, month, 0).getDate();
            const mStr = new Date(year, month - 1).toLocaleString("en-US", { month: "short" });
            const monthDisplay = `${mStr}-${year.toString().slice(-2)}`;

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Timesheet");

            // --- HEADER SECTION ---
            worksheet.mergeCells("A1:G1");
            const titleCell = worksheet.getCell("A1");
            titleCell.value = "TBG/URNI Monthly Timesheet";
            titleCell.font = { bold: true, size: 16, name: "Calibri" };
            titleCell.alignment = { horizontal: "center", vertical: "middle" };

            const addHeaderRow = (label: string, value: string, row: number) => {
                const labelCell = worksheet.getCell(`A${row}`);
                labelCell.value = label;
                labelCell.font = { bold: true, name: "Calibri" };
                labelCell.alignment = { horizontal: "right", vertical: "middle" };

                worksheet.mergeCells(`B${row}:E${row}`);
                const valCell = worksheet.getCell(`B${row}`);
                valCell.value = value;
                valCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFFFF00" }, // Yellow
                };
                valCell.alignment = { horizontal: "center", vertical: "middle" };
                valCell.border = {
                    bottom: { style: "thin" },
                };
            };

            addHeaderRow("Name", userInfo?.name || userName || "", 3);
            addHeaderRow("Designation", userInfo?.department || "", 4);
            addHeaderRow("Company", userInfo?.company || "TBG", 5);
            addHeaderRow("Contract No.", "", 6);

            // Month Row
            const monthLabel = worksheet.getCell("A7");
            monthLabel.value = "Month";
            monthLabel.font = { bold: true, name: "Calibri" };
            monthLabel.alignment = { horizontal: "right", vertical: "middle" };

            worksheet.mergeCells("B7:D7");
            const monthVal = worksheet.getCell("B7");
            monthVal.value = monthDisplay;
            monthVal.font = { bold: true, color: { argb: "FF0000FF" }, name: "Calibri" };
            monthVal.alignment = { horizontal: "center", vertical: "middle" };
            monthVal.border = { bottom: { style: "thin" } };

            // --- TABLE HEADER ---
            const headerRow = worksheet.getRow(9);
            headerRow.values = ["Day", "Date", "Home", "Inter-State Travel", "Office", "Activity Description and Progress", "Challenges"];
            headerRow.height = 35;
            headerRow.eachCell((cell: any) => {
                cell.font = { bold: true, size: 10, name: "Calibri" };
                cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
                cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
            });

            let totalHome = 0; let totalOffice = 0; let totalInterstate = 0;

            for (let day = 1; day <= daysInMonth; day++) {
                const currentDate = new Date(year, month - 1, day);
                const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" });
                const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

                // Flexible log matching (Backend might store YYYY-MM-DD or full date)
                const log = appraisals.find(l => l.date.includes(dateKey) || new Date(l.date).getDate() === day);

                const workplace = log?.workplace?.toLowerCase() || "";
                if (workplace === "home") totalHome++;
                else if (workplace === "interstate") totalInterstate++;
                else if (workplace === "office") totalOffice++;

                const row = worksheet.getRow(9 + day);
                row.values = [dayName, day, workplace === "home" ? "1" : "", workplace === "interstate" ? "1" : "", workplace === "office" ? "1" : "", log?.achievements || "", log?.challenges || ""];

                const isWeekend = dayName === "Saturday" || dayName === "Sunday";
                const fillColor = isWeekend ? "FFFFFF00" : "FFFFFFFF";
                const textColor = !isWeekend ? "FF0000FF" : "FF000000";

                row.eachCell((cell: any, colNumber: any) => {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
                    cell.font = { size: 11, name: "Calibri", color: { argb: colNumber === 1 ? textColor : "FF000000" } };
                    cell.alignment = { horizontal: colNumber === 6 || colNumber === 7 ? "left" : "center", vertical: "middle", wrapText: true };
                    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
                });
            }

            const totalRowIndex = 9 + daysInMonth + 1;
            const totalRow = worksheet.getRow(totalRowIndex);
            totalRow.values = ["TOTAL", "", totalHome, totalInterstate, totalOffice, "", ""];
            totalRow.eachCell((cell, colNumber) => {
                cell.font = { bold: true, size: 11, name: "Calibri" };
                cell.alignment = { horizontal: "center", vertical: "middle" };
                cell.border = { top: { style: "thick" }, bottom: { style: "thick" }, left: { style: "thin" }, right: { style: "thin" } };
                if (colNumber >= 3 && colNumber <= 5) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDDDDD" } };
            });
            worksheet.mergeCells(`A${totalRowIndex}:B${totalRowIndex}`);

            worksheet.columns = [{ width: 15 }, { width: 8 }, { width: 8 }, { width: 15 }, { width: 8 }, { width: 40 }, { width: 40 }];

            // Signatures
            let currentRow = 9 + daysInMonth + 3;
            worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
            worksheet.getCell(`A${currentRow}`).value = `Prepared By: ${userInfo?.name || userName || ""}`;
            worksheet.getCell(`A${currentRow}`).font = { bold: true, name: "Calibri", size: 12 };
            currentRow++;

            const userSigUrl = getImageUrl(userInfo?.signature_url);
            if (userSigUrl) {
                const base64 = await getBase64(userSigUrl);
                if (base64) {
                    const imageId = workbook.addImage({ base64, extension: "png" });
                    worksheet.addImage(imageId, { tl: { col: 0, row: currentRow - 1 }, ext: { width: 140, height: 60 } });
                    worksheet.getRow(currentRow).height = 60;
                }
            } else {
                worksheet.getCell(`A${currentRow}`).value = "________________";
            }
            currentRow += 2;

            worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
            worksheet.getCell(`A${currentRow}`).value = `Verified and Approved By MD: ${userInfo?.mdName || ""}`;
            worksheet.getCell(`A${currentRow}`).font = { bold: true, name: "Calibri", size: 12 };
            currentRow++;

            const mdSigUrl = getImageUrl(userInfo?.mdSignature);
            if (mdSigUrl) {
                const base64 = await getBase64(mdSigUrl);
                if (base64) {
                    const imageId = workbook.addImage({ base64, extension: "png" });
                    worksheet.addImage(imageId, { tl: { col: 0, row: currentRow - 1 }, ext: { width: 140, height: 60 } });
                    worksheet.getRow(currentRow).height = 60;
                }
            } else {
                worksheet.getCell(`A${currentRow}`).value = "________________";
            }

            const buffer = await workbook.xlsx.writeBuffer();
            const fileName = `${(userName || userInfo?.name || "User").replace(/\s+/g, "_")}_Timesheet_${mStr}_${year}.xlsx`;
            saveAs(new Blob([buffer]), fileName);

        } catch (error) {
            console.error("Export Excel Error:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const exportToWord = async () => {
        if (!appraisals.length) return;
        try {
            const mName = new Date(year, month - 1).toLocaleString("en-US", { month: "long" });
            const daysInMonth = new Date(year, month, 0).getDate();
            const totalDays = appraisals.length;
            const completionRate = ((totalDays / daysInMonth) * 100).toFixed(1);

            const children: any[] = [
                new Paragraph({ text: "TBG", alignment: "center", style: "Heading1" }),
                new Paragraph({ text: "MONTHLY APPRAISAL REPORT", alignment: "center", spacing: { after: 200, before: 100 }, style: "Heading1" }),
                new Paragraph({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", alignment: "center", spacing: { after: 300 } }),
                new Paragraph({ text: "REPORT DETAILS", alignment: "center", spacing: { after: 200, before: 200 }, style: "Heading2" }),
                new Paragraph({ children: [new TextRun({ text: "Employee Name:  ", bold: true, size: 24 }), new TextRun({ text: userInfo?.name || userName || "N/A", size: 24 })] }),
                new Paragraph({ children: [new TextRun({ text: "Department:  ", bold: true, size: 24 }), new TextRun({ text: userInfo?.department || "N/A", size: 24 })] }),
                new Paragraph({ children: [new TextRun({ text: "Reporting Period:  ", bold: true, size: 24 }), new TextRun({ text: `${mName} ${year}`, size: 24 })] }),
                new Paragraph({ text: "", pageBreakBefore: true }),
                new Paragraph({ text: "EXECUTIVE SUMMARY", heading: HeadingLevel.HEADING_1, spacing: { after: 200, before: 200 } }),
                new Paragraph({ children: [new TextRun({ text: "Total Days in Month:  ", bold: true }), new TextRun({ text: `${daysInMonth} days` })] }),
                new Paragraph({ children: [new TextRun({ text: "Entries Submitted:  ", bold: true }), new TextRun({ text: `${totalDays} days` })] }),
                new Paragraph({ children: [new TextRun({ text: "Completion Rate:  ", bold: true }), new TextRun({ text: `${completionRate}%` })] }),
            ];

            for (let day = 1; day <= daysInMonth; day++) {
                const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const log = appraisals.find(l => l.date.includes(dateKey) || new Date(l.date).getDate() === day);
                const d = new Date(year, month - 1, day);
                const dayName = d.toLocaleDateString("en-US", { weekday: "long" });

                children.push(new Paragraph({
                    children: [new TextRun({ text: `${dayName}, ${d.toLocaleDateString()}`, bold: true, size: 26, color: "2E5090" })],
                    spacing: { before: 300, after: 150 },
                    border: { bottom: { color: "2E5090", space: 1, style: "single", size: 6 } }
                }));

                if (log) {
                    children.push(new Paragraph({ children: [new TextRun({ text: "✓ ACTIVITY", bold: true, color: "0F7C41" })] }));
                    children.push(new Paragraph({ text: log.achievements }));
                    children.push(new Paragraph({ children: [new TextRun({ text: "⚠ CHALLENGES", bold: true, color: "C44E00" })] }));
                    children.push(new Paragraph({ text: log.challenges }));
                } else {
                    children.push(new Paragraph({ text: "No activity recorded", italics: true }));
                }
            }

            const doc = new Document({
                sections: [{ children }],
                styles: {
                    paragraphStyles: [
                        { id: "Heading1", name: "Heading 1", run: { size: 32, bold: true, color: "2E5090" } },
                        { id: "Heading2", name: "Heading 2", run: { size: 28, bold: true, color: "2E5090" } }
                    ]
                }
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `${(userName || userInfo?.name || "User").replace(/\s+/g, "_")}_Report_${mName}_${year}.docx`);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDownload = () => {
        exportToExcel();
    };

    return (
        <div className="bg-zinc-900 rounded-4xl shadow-sm border border-zinc-800 overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="px-8 py-8 flex items-center justify-between flex-wrap gap-4 border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-orange-900/10 flex items-center justify-center text-orange-400">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight">Monthly Appraisals</h2>
                        {appraisals.length > 0 && (
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                Total Logs: <span className="text-orange-400">{appraisals.length}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="h-10 rounded-xl border-zinc-700 bg-zinc-800 text-sm font-bold focus:ring-orange-500 focus:border-orange-500 cursor-pointer pl-3 pr-8"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'short' })}</option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="h-10 rounded-xl border-zinc-700 bg-zinc-800 text-sm font-bold focus:ring-orange-500 focus:border-orange-500 cursor-pointer pl-3 pr-8"
                    >
                        {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i + 1).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <button
                        onClick={exportToExcel}
                        disabled={!appraisals.length || isExporting}
                        className="h-10 flex items-center gap-2 px-4 rounded-xl bg-green-600 text-white text-[10px] font-black uppercase tracking-wide hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-600/20"
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        <span className="hidden sm:inline">Excel</span>
                    </button>
                    <button
                        onClick={exportToWord}
                        disabled={!appraisals.length || isExporting}
                        className="h-10 flex items-center gap-2 px-4 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-wide hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
                    >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Word</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-x-auto min-h-[300px]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-800/30">
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">Date</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">Workplace</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Achievements</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Challenges</th>
                        </tr>
                    </thead>
                    <tbody className="divide-zinc-800">
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
                                    <div className="inline-flex p-3 rounded-2xl bg-red-900/20 mb-3">
                                        <TrendingUp className="h-6 w-6 text-red-500" />
                                    </div>
                                    <p className="text-sm font-bold text-red-500">{error}</p>
                                </td>
                            </tr>
                        ) : appraisals.length > 0 ? (
                            appraisals.map((appraisal, index) => (
                                <tr key={index} className="group hover:bg-zinc-800/30 transition-all">
                                    <td className="px-8 py-6 text-sm font-bold text-foreground align-top">
                                        {new Date(appraisal.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        <div className="text-[10px] text-gray-400 font-medium mt-1">
                                            {new Date(appraisal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 align-top">
                                        <span className={cn(
                                            "inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider",
                                            appraisal.workplace === 'office'
                                                ? "bg-green-900/30 text-green-400"
                                                : "bg-yellow-900/30 text-yellow-400"
                                        )}>
                                            {appraisal.workplace}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-gray-300 font-medium align-top min-w-[200px]">
                                        {appraisal.achievements}
                                    </td>
                                    <td className="px-8 py-6 text-gray-300 font-medium align-top min-w-[200px]">
                                        {appraisal.challenges}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-8 py-24 text-center">
                                    <div className="inline-flex p-4 rounded-3xl bg-zinc-800 mb-4">
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
