"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Clock,
  ChevronRight,
  Plus,
  BarChart3,
  Loader2,
  Ticket as TicketIcon,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  TimerOff,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Staff as StaffMember, Ticket as TicketItem, Department } from "@/app/types";
import { staffApi, ticketApi, departmentApi, attendanceApi } from "@/lib/api";
import api from "@/lib/api"; // Keep default for custom params if needed
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DeptStat {
  id: string;
  name: string;
  count: number;
  color: string;
}

interface WeekDayStat {
  day: string;
  date: string;
  present: number;
  late: number;
  earlyExit: number;
  total: number;
  color: string;
  hexColor: string;
}

interface DailyTotal {
  presentCount: number;
  lateCount: number;
  earlyExitCount: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DEPT_COLORS = [
  { bg: "bg-primary", hex: "#f97316" },
  { bg: "bg-blue-500", hex: "#3b82f6" },
  { bg: "bg-green-500", hex: "#22c55e" },
  { bg: "bg-purple-500", hex: "#a855f7" },
  { bg: "bg-pink-500", hex: "#ec4899" },
  { bg: "bg-indigo-500", hex: "#6366f1" },
  { bg: "bg-cyan-500", hex: "#06b6d4" },
];

const WEEK_COLORS = [
  { bg: "bg-slate-500", hex: "#64748b" },
  { bg: "bg-cyan-600", hex: "#0891b2" },
  { bg: "bg-amber-600", hex: "#d97706" },
  { bg: "bg-indigo-500", hex: "#6366f1" },
  { bg: "bg-rose-600", hex: "#e11d48" },
];

// Helper to get Monday of a given week date
const getMondayOf = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtShort = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [latestStaff, setLatestStaff] = useState<StaffMember[]>([]);
  const [latestTickets, setLatestTickets] = useState<TicketItem[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DeptStat[]>([]);
  const [weekDayStats, setWeekDayStats] = useState<WeekDayStat[]>([]);
  const [todayTotals, setTodayTotals] = useState<DailyTotal>({
    presentCount: 0,
    lateCount: 0,
    earlyExitCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<Date>(
    getMondayOf(new Date()),
  );
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // -----------------------------------------------------------------------
  // Fetch all dashboard data
  // -----------------------------------------------------------------------
  const fetchDashboardData = useCallback(
    async (weekStart: Date, isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);

      try {
        const weekStartStr = fmtShort(weekStart);
        console.log("Fetching dashboard data for week starting:", weekStartStr);

        // Fire all requests in parallel
        const [staffRes, deptRes, ticketsRes, dailyRes] =
          await Promise.allSettled([
            staffApi.getAll(),
            departmentApi.getAll(),
            ticketApi.getAll(1, 10),
            api.get("api/attendance/metrics/daily?limit=100"),
          ]);

        // -------- Staff --------
        const rawStaff: StaffMember[] =
          staffRes.status === "fulfilled" ? staffRes.value : [];

        setStaffList(rawStaff);
        const sorted = [...rawStaff]
          .sort(
            (a, b) =>
              new Date(b.created_at || 0).getTime() -
              new Date(a.created_at || 0).getTime(),
          )
          .slice(0, 6);
        setLatestStaff(sorted);

        // -------- Departments --------
        let rawDepts: Department[] = [];
        if (deptRes.status === "fulfilled") {
          rawDepts = deptRes.value;
        }

        // Count staff per department using staff list (accurate + fast)
        const deptMap: Record<string, number> = {};
        rawStaff.forEach((s) => {
          const dId =
            s.department_id ||
            (typeof s.department === "object" && s.department
              ? (s.department as any)._id || (s.department as any).id
              : null);
          const dName = typeof s.department === "string" ? s.department : "";
          if (dId) deptMap[dId] = (deptMap[dId] || 0) + 1;
          else if (dName) deptMap[dName] = (deptMap[dName] || 0) + 1;
        });

        const deptStats: DeptStat[] = rawDepts
          .map((d, i) => ({
            id: d._id || d.id || "",
            name: d.name,
            count: deptMap[d._id || ""] || deptMap[d.id || ""] || deptMap[d.name] || 0,
            color: DEPT_COLORS[i % DEPT_COLORS.length].bg,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        setDepartmentStats(deptStats);

        // -------- Tickets --------
        if (ticketsRes.status === "fulfilled") {
          setLatestTickets(ticketsRes.value.data.slice(0, 5));
        }

        // -------- Weekly Attendance Chart --------
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        const dayStats: WeekDayStat[] = days.map((day, i) => {
          const d = new Date(weekStart);
          d.setDate(weekStart.getDate() + i);
          return {
            day,
            date: fmtShort(d),
            present: 0,
            late: 0,
            earlyExit: 0,
            total: 0,
            color: WEEK_COLORS[i].bg,
            hexColor: WEEK_COLORS[i].hex,
          };
        });

        // Fetch 5 daily requests concurrently (Mon–Fri of selected week)
        const dailyResults = await Promise.allSettled(
          dayStats.map((ds) =>
            api.get(`api/attendance/metrics/daily?date=${ds.date}&limit=200`),
          ),
        );

        dailyResults.forEach((result, i) => {
          if (result.status === "fulfilled") {
            const summary = result.value.data?.data?.summary || result.value.data?.summary;
            if (summary) {
              dayStats[i].present = summary.presentCount || 0;
              dayStats[i].late = summary.lateCount || 0;
              dayStats[i].earlyExit = summary.earlyExitCount || 0;
              dayStats[i].total = summary.totalEmployees || 0;
            }
          }
        });

        setWeekDayStats(dayStats);

        // -------- Today's Summary --------
        if (dailyRes.status === "fulfilled") {
          const summary = dailyRes.value.data?.data?.summary || dailyRes.value.data?.summary;
          if (summary) {
            setTodayTotals({
              presentCount: summary.presentCount || 0,
              lateCount: summary.lateCount || 0,
              earlyExitCount: summary.earlyExitCount || 0,
            });
          }
        }

        setLastUpdated(new Date());
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchDashboardData(selectedWeek);
  }, [selectedWeek, fetchDashboardData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        fetchDashboardData(selectedWeek, true);
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [selectedWeek, fetchDashboardData]);

  // -----------------------------------------------------------------------
  // Derived values
  // -----------------------------------------------------------------------
  const staffCount = staffList.length;
  const totalToday =
    todayTotals.presentCount +
    todayTotals.lateCount +
    todayTotals.earlyExitCount;
  const attendanceRate =
    staffCount > 0 ? Math.round((totalToday / staffCount) * 100) : 0;

  // For the pie chart: sum of all week's attendance counts
  const weekTotal = weekDayStats.reduce(
    (acc, d) => acc + d.present + d.late + d.earlyExit,
    0,
  );

  // Build SVG pie slices from weekDayStats
  const weekPieSlices = (() => {
    if (weekTotal === 0) return [];
    const segments: { pct: number; color: string }[] = weekDayStats.map(
      (d) => ({
        pct: (d.present + d.late + d.earlyExit) / weekTotal,
        color: d.hexColor,
      }),
    );
    let currentOffset = 0;
    return segments.map((seg) => {
      const slice = { pct: seg.pct, color: seg.color, offset: currentOffset };
      currentOffset += seg.pct * 100;
      return slice;
    });
  })();

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-gray-400 font-bold">
          Loading dashboard data…
        </p>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Overview
          </h1>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              Last updated{" "}
              {lastUpdated.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <button
          onClick={() => fetchDashboardData(selectedWeek, true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-bold text-gray-400 hover:text-foreground hover:border-zinc-700 transition-all disabled:opacity-50"
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
          />
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Staff",
            value: staffCount,
            sub: "Registered employees",
            icon: Users,
            color: "text-primary",
            bg: "bg-orange-950/30",
          },
          {
            label: "Present Today",
            value: todayTotals.presentCount,
            sub: `${attendanceRate}% of workforce`,
            icon: UserCheck,
            color: "text-green-400",
            bg: "bg-green-950/30",
          },
          {
            label: "Late Today",
            value: todayTotals.lateCount,
            sub: "Clocked in after 9 AM",
            icon: TimerOff,
            color: "text-amber-400",
            bg: "bg-amber-950/30",
          },
          {
            label: "Early Exits",
            value: todayTotals.earlyExitCount,
            sub: "Left before 4 PM",
            icon: TrendingUp,
            color: "text-red-400",
            bg: "bg-red-950/30",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800"
          >
            <div className={cn("inline-flex p-2 rounded-xl mb-4", card.bg)}>
              <card.icon className={cn("h-5 w-5", card.color)} />
            </div>
            <p className="text-3xl font-black text-foreground">{card.value}</p>
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 mt-1">
              {card.label}
            </p>
            <p className="text-xs text-gray-600 mt-0.5 font-medium">
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8/12) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Weekly Attendance Chart */}
          <div className="bg-zinc-900 rounded-4xl p-8 shadow-sm border border-zinc-800 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-800 p-2.5 rounded-2xl">
                    <BarChart3 className="h-5 w-5 text-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Weekly Attendance
                  </h2>
                </div>
                <p className="text-gray-500 text-sm">
                  Real attendance counts across Mon–Fri of the selected week.
                </p>
              </div>

              {/* Week Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowWeekPicker(!showWeekPicker)}
                  className="bg-zinc-800 px-4 py-2 rounded-xl text-sm font-bold border border-zinc-700 flex items-center gap-2 hover:bg-zinc-700 transition-all"
                >
                  {fmtDate(selectedWeek)} –{" "}
                  {fmtDate(
                    new Date(
                      new Date(selectedWeek).setDate(
                        selectedWeek.getDate() + 4,
                      ),
                    ),
                  )}
                  <span
                    className={cn(
                      "text-gray-400 transition-transform inline-block",
                      showWeekPicker && "rotate-180",
                    )}
                  >
                    ▾
                  </span>
                </button>

                {showWeekPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowWeekPicker(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 p-4 z-20">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                        Select Week
                      </h4>
                      <div className="space-y-2">
                        {[0, -1, -2, -3].map((offset) => {
                          const base = new Date();
                          base.setDate(base.getDate() + offset * 7);
                          const mon = getMondayOf(base);
                          const fri = new Date(mon);
                          fri.setDate(mon.getDate() + 4);
                          const isSel =
                            mon.getTime() === selectedWeek.getTime();
                          return (
                            <button
                              key={offset}
                              onClick={() => {
                                setSelectedWeek(mon);
                                setShowWeekPicker(false);
                              }}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex justify-between items-center",
                                isSel
                                  ? "bg-primary text-white"
                                  : "hover:bg-zinc-800 text-foreground",
                              )}
                            >
                              <span>
                                {fmtDate(mon)} – {fmtDate(fri)}
                              </span>
                              {offset === 0 && (
                                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                                  Current
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Chart Area */}
            <div className="mt-10 flex items-center justify-between gap-8">
              {/* SVG Pie */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <div className="relative w-48 h-48">
                  {weekTotal > 0 ? (
                    <svg
                      className="w-full h-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      {weekPieSlices.map((seg, i) => (
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r="15.9155"
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="32"
                          strokeDasharray={`${seg.pct * 100} ${100 - seg.pct * 100}`}
                          strokeDashoffset={-seg.offset}
                          className="transition-all duration-500 hover:opacity-80"
                        />
                      ))}
                    </svg>
                  ) : (
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="15.9155"
                        fill="transparent"
                        stroke="#27272a"
                        strokeWidth="32"
                      />
                    </svg>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-foreground tracking-tighter">
                      {weekTotal}
                    </span>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">
                      This Week
                    </p>
                  </div>
                </div>
              </div>

              {/* Legend + bars */}
              <div className="flex-1 space-y-4">
                {weekDayStats.length > 0 ? (
                  weekDayStats.map((item, i) => {
                    const dayTotal = item.present + item.late + item.earlyExit;
                    const pct =
                      staffCount > 0
                        ? Math.round((dayTotal / staffCount) * 100)
                        : 0;
                    return (
                      <div key={i} className="group/item">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn("w-3 h-3 rounded-full", item.color)}
                            />
                            <span className="text-sm font-bold text-foreground">
                              {item.day}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                            <span className="text-green-400">
                              {item.present}P
                            </span>
                            <span className="text-amber-400">{item.late}L</span>
                            <span className="text-red-400">
                              {item.earlyExit}E
                            </span>
                            <span className="text-gray-500 w-8 text-right">
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-700",
                              item.color,
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-gray-500 font-bold">
                      No attendance data for this week
                    </p>
                  </div>
                )}
                <div className="flex gap-4 pt-2 text-[10px] font-black uppercase tracking-widest text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />{" "}
                    Present
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{" "}
                    Late
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />{" "}
                    Early Exit
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Latest Staff */}
          <div className="bg-zinc-900 rounded-4xl p-8 shadow-sm border border-zinc-800">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-orange-950/30 p-2 rounded-xl">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-2xl font-black text-foreground tracking-tight">
                  Latest Registrations
                </h3>
              </div>
              <Link
                href="/dashboard/staff"
                className="text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-2"
              >
                Manage Team <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {latestStaff.map((person, i) => {
                const personId = person.id || person._id || "";
                const deptName =
                  typeof person.department === "object" && person.department
                    ? (person.department as any).name
                    : person.department || "—";
                return (
                  <Link
                    key={personId || i}
                    href={`/dashboard/staff/view/${personId}`}
                    className="flex items-center justify-between p-4 rounded-3xl bg-zinc-800/50 transition-all hover:scale-[1.02] hover:bg-zinc-800 border border-transparent hover:border-zinc-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-primary font-black shadow-sm overflow-hidden">
                        {(person.profile_pic_url || person.profile_picture) ? (
                          <img 
                            src={(person.profile_pic_url || person.profile_picture) as string} 
                            alt={person.name} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          person.name?.[0]?.toUpperCase() || "?"
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground leading-none">
                          {person.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">
                          {person.role}
                        </p>
                        <p className="text-[10px] text-gray-600 font-medium mt-0.5">
                          {deptName}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ring-1 ring-inset",
                        person.is_active !== false
                          ? "bg-green-900/30 text-green-400 ring-green-600/20"
                          : "bg-zinc-800 text-gray-400 ring-gray-400/20",
                      )}
                    >
                      {person.is_active !== false ? "Active" : "Inactive"}
                    </span>
                  </Link>
                );
              })}
              {latestStaff.length === 0 && (
                <p className="col-span-2 py-8 text-center text-sm text-gray-400 font-bold">
                  No recent registrations found.
                </p>
              )}
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="bg-zinc-900 rounded-4xl p-8 shadow-sm border border-zinc-800">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-red-950/30 p-2 rounded-xl">
                  <TicketIcon className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-foreground tracking-tight">
                  Recent Disciplinary Tickets
                </h3>
              </div>
              <Link
                href="/dashboard/tickets"
                className="text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-2"
              >
                View Archive <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {latestTickets.map((ticket, i) => (
                <div
                  key={ticket.id || i}
                  className="flex items-center justify-between p-5 rounded-3xl bg-zinc-800/50 border border-transparent hover:border-red-900/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5">
                      {ticket.status === "RESOLVED" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle
                          className={cn(
                            "h-5 w-5",
                            ticket.severity >= 3
                              ? "text-red-500"
                              : "text-orange-500",
                          )}
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground leading-none">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">
                        {ticket.description}
                      </p>
                      {ticket.target_user && (
                        <p className="text-[10px] text-gray-600 mt-1 font-bold">
                          → {ticket.target_user.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                        ticket.status === "OPEN"
                          ? "bg-red-950/40 text-red-400"
                          : ticket.status === "RESOLVED"
                            ? "bg-green-950/40 text-green-400"
                            : "bg-zinc-800 text-gray-400",
                      )}
                    >
                      {ticket.status}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold">
                      SVR {ticket.severity}
                    </span>
                  </div>
                </div>
              ))}
              {latestTickets.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-sm font-bold text-gray-300 italic">
                    No recent disciplinary actions recorded.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Department Breakdown */}
          <div className="bg-zinc-900 rounded-4xl p-8 shadow-sm border border-zinc-800">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 p-2 rounded-xl">
                  <BarChart3 className="h-5 w-5 text-foreground" />
                </div>
                <h2 className="text-xl font-black text-foreground tracking-tight">
                  Departments
                </h2>
              </div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-zinc-800 px-3 py-1 rounded-full">
                {departmentStats.length} Groups
              </span>
            </div>

            <div className="space-y-6">
              {departmentStats.length > 0 ? (
                departmentStats.map((item, i) => (
                  <div key={item.id || i} className="group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all group-hover:scale-110 shrink-0",
                          item.color,
                        )}
                      >
                        <Plus className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate pr-2">
                            {item.name}
                          </h4>
                          <span className="text-base font-black text-foreground shrink-0">
                            {item.count}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-700",
                              item.color,
                            )}
                            style={{
                              width:
                                staffCount > 0
                                  ? `${Math.min(100, (item.count / staffCount) * 100)}%`
                                  : "0%",
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                          {staffCount > 0
                            ? Math.round((item.count / staffCount) * 100)
                            : 0}
                          % of workforce
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 font-bold text-center py-6">
                  No departments found.
                </p>
              )}
            </div>

            {/* Total Stats */}
            <div className="mt-8 pt-6 border-t border-zinc-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-400">
                  Today's Totals
                </h3>
                <span className="text-[10px] bg-orange-50 text-primary px-2.5 py-1 rounded-full font-black uppercase">
                  Live
                </span>
              </div>
              <div className="flex items-end justify-between gap-4 mt-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Global Staff
                  </p>
                  <p className="text-4xl font-black mt-1 text-foreground">
                    {staffCount}
                  </p>
                </div>
                <div className="pl-5 border-zinc-800/50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Active Today
                  </p>
                  <p className="text-4xl font-black mt-1 text-foreground">
                    {totalToday}
                  </p>
                </div>
              </div>
              {/* Sparkline */}
              <div className="mt-6 flex items-end gap-1.5 h-10">
                {weekDayStats.map((d, i) => {
                  const dayTotal = d.present + d.late + d.earlyExit;
                  const maxH = Math.max(
                    ...weekDayStats.map(
                      (x) => x.present + x.late + x.earlyExit,
                    ),
                    1,
                  );
                  const hPct = (dayTotal / maxH) * 100;
                  return (
                    <div
                      key={i}
                      title={`${d.day}: ${dayTotal}`}
                      className={cn(
                        "flex-1 rounded-full hover:opacity-80 transition-all cursor-pointer",
                        d.color,
                      )}
                      style={{ height: `${Math.max(8, hPct)}%` }}
                    />
                  );
                })}
                {weekDayStats.length === 0 &&
                  [1, 2, 3, 4, 5].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full bg-zinc-800"
                      style={{ height: "20%" }}
                    />
                  ))}
              </div>
              <div className="flex justify-between mt-1.5">
                {["M", "T", "W", "T", "F"].map((l, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-black text-gray-600 flex-1 text-center"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-zinc-900 rounded-4xl p-6 border border-zinc-800 space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Quick Actions
            </h4>
            {[
              {
                label: "Add Staff Member",
                href: "/dashboard/staff/create",
                icon: Users,
              },
              {
                label: "Issue Ticket",
                href: "/dashboard/tickets",
                icon: TicketIcon,
              },
              {
                label: "View All Staff",
                href: "/dashboard/staff",
                icon: ChevronRight,
              },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all group"
              >
                <a.icon className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {a.label}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-600 ml-auto group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
