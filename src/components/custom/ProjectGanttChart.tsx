
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Download, Save, RefreshCw, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

// Types
export interface GanttActivity {
    id: string;
    sn: string; // A, 1, 2, B...
    activity: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    isHeader: boolean;
    parentId?: string; // To group under A, B, C...
}

type ActivityStatus = 'completed' | 'in-progress' | 'upcoming' | 'delayed';

const DEFAULT_ACTIVITIES: GanttActivity[] = [
    { id: 'a', sn: 'A', activity: 'Land Allotment and Layout', startDate: '2025-11-03', endDate: '2025-11-30', isHeader: true },
    { id: 'a1', sn: '1', activity: 'Land Allotment', startDate: '2025-11-03', endDate: '2025-11-03', isHeader: false, parentId: 'a' },
    { id: 'a2', sn: '2', activity: 'Land Demarcation', startDate: '2025-11-11', endDate: '2025-11-11', isHeader: false, parentId: 'a' },
    { id: 'a3', sn: '3', activity: 'Contouring & Layout', startDate: '2025-11-11', endDate: '2025-11-30', isHeader: false, parentId: 'a' },
    { id: 'b', sn: 'B', activity: 'Control Room Building', startDate: '2025-12-01', endDate: '2026-01-31', isHeader: true },
    { id: 'b1', sn: '1', activity: 'Excavation/PCC in foundation', startDate: '2025-12-01', endDate: '2025-12-04', isHeader: false, parentId: 'b' },
    { id: 'b2', sn: '2', activity: 'Column Reinforcement', startDate: '2025-12-05', endDate: '2025-12-10', isHeader: false, parentId: 'b' },
    { id: 'b3', sn: '3', activity: 'Footing Concrete', startDate: '2025-12-15', endDate: '2025-12-23', isHeader: false, parentId: 'b' },
];

export function ProjectGanttChart({
    initialActivities = DEFAULT_ACTIVITIES,
    timelineStart,
    timelineEnd
}: {
    initialActivities?: GanttActivity[],
    timelineStart?: string,
    timelineEnd?: string
}) {
    const [activities, setActivities] = useState<GanttActivity[]>(initialActivities);

    // Timeline Settings
    const [viewStartDate, setViewStartDate] = useState<Date>(
        timelineStart ? new Date(timelineStart) : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    );
    const cellWidth = 30; // Width of one day cell

    // Robust date parsing helper
    const parseDate = (dateStr: string) => {
        if (!dateStr) return null;
        // Try standard Date constructor first (handles YYYY-MM-DD)
        let d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
        return null;
    };

    // Calculate duration in days
    const getDuration = (start: string, end: string) => {
        const s = parseDate(start)?.getTime();
        const e = parseDate(end)?.getTime();

        if (!s || !e) return 0;

        // Handle case where End Date is before Start Date
        if (e < s) return 0;

        const diffTime = e - s;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
    };

    // Get activity status based on dates
    const getActivityStatus = (start: string, end: string): ActivityStatus => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (now > endDate) return 'completed';
        if (now >= startDate && now <= endDate) return 'in-progress';
        if (now < startDate) return 'upcoming';
        return 'upcoming';
    };

    // Get progress percentage
    const getProgressPercentage = (start: string, end: string): number => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (now < startDate) return 0;
        if (now > endDate) return 100;

        const total = endDate.getTime() - startDate.getTime();
        if (total <= 0) return 0;

        const elapsed = now.getTime() - startDate.getTime();
        return Math.round((elapsed / total) * 100);
    };

    // Get color scheme based on status
    const getBarColorClass = (status: ActivityStatus, isHeader: boolean) => {
        if (isHeader) {
            return 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 border-2 border-purple-400 shadow-lg shadow-purple-500/30';
        }

        switch (status) {
            case 'completed':
                return 'bg-gradient-to-r from-emerald-400 to-teal-500 border-2 border-emerald-400 shadow-md shadow-emerald-500/30';
            case 'in-progress':
                return 'bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 border-2 border-blue-400 shadow-md shadow-blue-500/30 animate-pulse-subtle';
            case 'delayed':
                return 'bg-gradient-to-r from-red-400 to-pink-500 border-2 border-red-400 shadow-md shadow-red-500/30';
            default: // upcoming
                return 'bg-gradient-to-r from-amber-400 to-orange-500 border-2 border-amber-400 shadow-md shadow-amber-500/30';
        }
    };

    // Get status badge
    const getStatusBadge = (status: ActivityStatus) => {
        const badges = {
            completed: { label: 'Completed', class: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
            'in-progress': { label: 'In Progress', class: 'bg-blue-100 text-blue-700 border-blue-300' },
            delayed: { label: 'Delayed', class: 'bg-red-100 text-red-700 border-red-300' },
            upcoming: { label: 'Upcoming', class: 'bg-amber-100 text-amber-700 border-amber-300' }
        };
        return badges[status];
    };

    // Calculate position for bars - normalize to viewStartDate
    const getBarPosition = (start: string, end: string) => {
        const s = new Date(start);
        const viewStart = new Date(viewStartDate);

        // Days from view start
        const diffTime = s.getTime() - viewStart.getTime();
        const offsetDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const duration = getDuration(start, end);

        return {
            left: offsetDays * cellWidth,
            width: duration * cellWidth
        };
    };

    // Get today marker position
    const getTodayPosition = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const viewStart = new Date(viewStartDate);
        const diffTime = today.getTime() - viewStart.getTime();
        const offsetDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return offsetDays * cellWidth;
    };

    // Check if day is weekend
    const isWeekend = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
    };

    // Generate Timeline Headers (Months -> Days)
    const timelineHeaders = useMemo(() => {
        const months = [];
        const days = [];
        let currentDate = new Date(viewStartDate);

        // Calculate total days based on range if provided, else default to 365 (1 year)
        let totalDays = 365;
        if (timelineEnd && timelineStart) {
            const start = new Date(timelineStart).getTime();
            const end = new Date(timelineEnd).getTime();
            if (!isNaN(start) && !isNaN(end) && end >= start) {
                const diff = end - start;
                const calcDays = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 60;
                totalDays = Math.max(totalDays, calcDays);
            }
        }

        // Final safeguard logic handled by initialization above, but ensure min 365
        totalDays = Math.max(365, totalDays);

        for (let i = 0; i < totalDays; i++) {
            days.push({
                date: new Date(currentDate),
                dayOfMonth: currentDate.getDate(),
                isWeekend: isWeekend(currentDate)
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Group by Month
        let currentMonthLabel = '';
        let currentMonthDays = 0;

        days.forEach((day) => {
            const monthLabel = day.date.toLocaleString('default', { month: 'short', year: '2-digit' });
            if (monthLabel !== currentMonthLabel) {
                if (currentMonthLabel) {
                    months.push({ label: currentMonthLabel, days: currentMonthDays });
                }
                currentMonthLabel = monthLabel;
                currentMonthDays = 1;
            } else {
                currentMonthDays++;
            }
        });
        months.push({ label: currentMonthLabel, days: currentMonthDays });

        return { months, days };
    }, [viewStartDate, timelineStart, timelineEnd]);

    // Update Activity Handler
    const handleUpdateActivity = (id: string, field: keyof GanttActivity, value: string) => {
        setActivities(prev => prev.map(a => {
            if (a.id === id) {
                return { ...a, [field]: value };
            }
            return a;
        }));
    };

    const handleSave = () => {
        // In a real app, this would make an API call
        console.log('Saving activities:', activities);
        toast.success("Schedule saved successfully!");
    };

    const handleExport = () => {
        const exportData = activities.map(a => ({
            'S.N': a.sn,
            'Activity': a.activity,
            'Start Date': a.startDate,
            'End Date': a.endDate,
            'Duration (Days)': getDuration(a.startDate, a.endDate),
            'Status': getActivityStatus(a.startDate, a.endDate),
            'Progress %': getProgressPercentage(a.startDate, a.endDate)
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Construction Schedule");
        XLSX.writeFile(wb, "Construction_Schedule.xlsx");
        toast.success("Schedule exported to Excel!");
    };

    const todayPosition = getTodayPosition();

    return (
        <div className="flex flex-col h-full w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivities(DEFAULT_ACTIVITIES)}
                        className="whitespace-nowrap border-purple-200 text-purple-700 hover:bg-purple-50 transition-all hover:shadow-md"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" /> Reset
                    </Button>
                    <div className="h-6 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent mx-2 hidden sm:block"></div>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-slate-700">Timeline Start:</span>
                        <Input
                            type="date"
                            value={viewStartDate.toISOString().split('T')[0]}
                            onChange={(e) => setViewStartDate(new Date(e.target.value))}
                            className="w-auto h-8 border-blue-200/60 focus:ring-blue-400"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-all hover:shadow-md"
                    >
                        <Download className="h-4 w-4 mr-2" /> Export
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                    >
                        <Save className="h-4 w-4 mr-2" /> Save
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative m-4 border border-slate-200/60 rounded-2xl bg-white/90 backdrop-blur-sm shadow-2xl ring-1 ring-slate-100">
                {/* Fixed Left Column (Table) */}
                <div className="w-[580px] flex-shrink-0 flex flex-col border-r border-slate-200/60 bg-white/95 backdrop-blur-sm z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.08)]">
                    {/* Table Header */}
                    <div className="flex h-[50px] border-b border-slate-200/60 bg-gradient-to-r from-slate-50 via-blue-50/30 to-purple-50/20 font-semibold text-xs text-slate-700 tracking-tight">
                        <div className="w-12 flex items-center justify-center border-r border-slate-200/60">S.N</div>
                        <div className="flex-1 flex items-center px-4 border-r border-slate-200/60">Activity</div>
                        <div className="w-28 flex flex-col border-r border-slate-200/60">
                            <div className="border-b border-slate-200/60 h-1/2 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50/50">From</div>
                            <div className="h-1/2 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50/50">To</div>
                        </div>
                        <div className="w-16 flex items-center justify-center border-r border-slate-200/60 bg-slate-50/80">Days</div>
                        <div className="w-28 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50/50">Status</div>
                    </div>

                    {/* Table Rows */}
                    <ScrollArea className="flex-1">
                        {activities.map((activity) => {
                            const status = getActivityStatus(activity.startDate, activity.endDate);
                            const progress = getProgressPercentage(activity.startDate, activity.endDate);
                            const statusBadge = getStatusBadge(status);

                            return (
                                <div
                                    key={activity.id}
                                    className={`flex h-[40px] border-b border-slate-100/60 hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-purple-50/30 transition-all duration-200 group ${activity.isHeader ? 'bg-gradient-to-r from-slate-50/80 to-blue-50/30' : ''}`}
                                >
                                    <div className="w-12 flex items-center justify-center border-r border-slate-200/60 text-xs font-medium text-slate-600">
                                        <Input
                                            className="h-full w-full border-none bg-transparent p-0 text-center focus-visible:ring-1 focus-visible:ring-blue-400 text-xs shadow-none transition-all"
                                            value={activity.sn}
                                            onChange={(e) => handleUpdateActivity(activity.id, 'sn', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1 border-r border-slate-200/60 px-3 flex items-center relative">
                                        {/* Mini progress bar */}
                                        {!activity.isHeader && progress > 0 && (
                                            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                        )}
                                        <Input
                                            className={`h-full w-full border-none bg-transparent p-0 focus-visible:ring-1 focus-visible:ring-blue-400 text-xs shadow-none transition-all ${activity.isHeader ? 'font-bold text-slate-800' : 'text-slate-600'}`}
                                            value={activity.activity}
                                            onChange={(e) => handleUpdateActivity(activity.id, 'activity', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-28 border-r border-slate-200/60 flex flex-col">
                                        <input
                                            type="date"
                                            className="h-1/2 w-full text-[10px] border-none bg-transparent px-2 focus:outline-none focus:bg-blue-50/30 text-slate-500 font-mono tracking-tighter transition-colors"
                                            value={activity.startDate}
                                            onChange={(e) => handleUpdateActivity(activity.id, 'startDate', e.target.value)}
                                        />
                                        <input
                                            type="date"
                                            className="h-1/2 w-full text-[10px] border-none bg-transparent px-2 border-t border-slate-100/60 focus:outline-none focus:bg-purple-50/30 text-slate-500 font-mono tracking-tighter transition-colors"
                                            value={activity.endDate}
                                            onChange={(e) => handleUpdateActivity(activity.id, 'endDate', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-16 flex items-center justify-center border-r border-slate-200/60 text-xs font-bold text-slate-700 bg-slate-50/50">
                                        {getDuration(activity.startDate, activity.endDate)}
                                    </div>
                                    <div className="w-28 flex items-center justify-center px-1">
                                        <div className={`text-[9px] font-semibold px-2 py-1 rounded-full border ${statusBadge.class} whitespace-nowrap`}>
                                            {statusBadge.label}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </ScrollArea>
                </div>

                {/* Right Scrollable Timeline */}
                <ScrollArea className="flex-1 bg-gradient-to-br from-white to-slate-50/50">
                    <div className="flex flex-col min-w-max relative">
                        {/* Timeline Header */}
                        <div className="h-[50px] flex border-b border-slate-200/60 bg-gradient-to-r from-slate-50 via-blue-50/30 to-purple-50/20 sticky top-0 z-10 font-semibold text-xs text-slate-700">
                            {timelineHeaders.months.map((month, idx) => (
                                <div key={idx} className="flex flex-col border-r border-slate-200/60 h-full" style={{ width: month.days * cellWidth }}>
                                    <div className="h-1/2 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 border-b border-slate-200/60 text-white font-bold tracking-wide shadow-sm">
                                        {month.label}
                                    </div>
                                    <div className="flex h-1/2 bg-gradient-to-br from-slate-50/80 to-blue-50/50">
                                        <div className="w-full h-full"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Timeline Grid & Bars */}
                        <div className="relative">
                            {/* Weekend Highlights */}
                            <div className="absolute inset-0 pointer-events-none z-0 flex">
                                {timelineHeaders.days.map((day, idx) => (
                                    <div
                                        key={idx}
                                        className={`border-r h-full ${day.isWeekend ? 'bg-slate-100/40 border-slate-200/40' : 'border-dashed border-slate-100/60'}`}
                                        style={{ width: cellWidth }}
                                    ></div>
                                ))}
                            </div>

                            {/* Today Marker */}
                            {todayPosition >= 0 && todayPosition < timelineHeaders.days.length * cellWidth && (
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-pink-500 to-red-500 z-20 shadow-lg shadow-red-500/50 animate-pulse-glow"
                                    style={{ left: `${todayPosition}px` }}
                                >
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap font-bold shadow-md">
                                        Today
                                    </div>
                                </div>
                            )}

                            {/* Activity Bars */}
                            {activities.map((activity) => {
                                const { left, width } = getBarPosition(activity.startDate, activity.endDate);
                                const status = getActivityStatus(activity.startDate, activity.endDate);
                                const progress = getProgressPercentage(activity.startDate, activity.endDate);
                                const colorClass = getBarColorClass(status, activity.isHeader);
                                const isMilestone = getDuration(activity.startDate, activity.endDate) === 1;

                                return (
                                    <div key={activity.id} className="h-[40px] border-b border-slate-100/60 relative z-10 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/20 transition-colors group">
                                        {width > 0 && left + width > 0 && (
                                            <div className="relative">
                                                {/* Main Bar */}
                                                <div
                                                    className={`absolute top-[8px] rounded-full ${colorClass} transition-all duration-500 ease-out group-hover:scale-105 group-hover:shadow-xl cursor-pointer overflow-hidden`}
                                                    style={{
                                                        left: `${Math.max(0, left)}px`,
                                                        width: `${Math.max(isMilestone ? 24 : width, 24)}px`,
                                                        height: isMilestone ? '24px' : '24px'
                                                    }}
                                                    title={`${activity.activity}\nDuration: ${getDuration(activity.startDate, activity.endDate)} days\nProgress: ${progress}%`}
                                                >
                                                    {/* Progress overlay for in-progress items */}
                                                    {status === 'in-progress' && !activity.isHeader && (
                                                        <div
                                                            className="absolute inset-0 bg-white/30 transition-all duration-500"
                                                            style={{ width: `${100 - progress}%`, right: 0 }}
                                                        ></div>
                                                    )}

                                                    {/* Percentage text */}
                                                    {!isMilestone && width > 40 && !activity.isHeader && (
                                                        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow-sm">
                                                            {progress}%
                                                        </div>
                                                    )}

                                                    {/* Milestone diamond */}
                                                    {isMilestone && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-3 h-3 bg-white/90 rotate-45 border-2 border-current"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </ScrollArea>
            </div>

            <style jsx global>{`
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.9; }
                }
                
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }
                    50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.8); }
                }
                
                .animate-pulse-subtle {
                    animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                
                .animate-pulse-glow {
                    animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
}

export default ProjectGanttChart;
