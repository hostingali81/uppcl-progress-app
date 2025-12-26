
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Download, Save, RefreshCw } from 'lucide-react';
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

export function ProjectGanttChart({ initialActivities = DEFAULT_ACTIVITIES }: { initialActivities?: GanttActivity[] }) {
    const [activities, setActivities] = useState<GanttActivity[]>(initialActivities);

    // Timeline Settings
    const [viewStartDate, setViewStartDate] = useState<Date>(new Date('2025-10-01')); // Default start view
    const cellWidth = 30; // Width of one day cell

    // Calculate duration in days
    const getDuration = (start: string, end: string) => {
        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        if (isNaN(s) || isNaN(e)) return 0;
        const diffTime = e - s;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
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

    // Generate Timeline Headers (Months -> Days)
    const timelineHeaders = useMemo(() => {
        const months = [];
        const days = [];
        let currentDate = new Date(viewStartDate);
        const totalDays = 180; // Render 6 months worth of days

        for (let i = 0; i < totalDays; i++) {
            days.push({
                date: new Date(currentDate),
                dayOfMonth: currentDate.getDate()
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
    }, [viewStartDate]);

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
            'Duration (Days)': getDuration(a.startDate, a.endDate)
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Construction Schedule");
        XLSX.writeFile(wb, "Construction_Schedule.xlsx");
        toast.success("Schedule exported to Excel!");
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-50">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white border-b shadow-sm gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    <Button variant="outline" size="sm" onClick={() => setActivities(DEFAULT_ACTIVITIES)} className="whitespace-nowrap">
                        <RefreshCw className="h-4 w-4 mr-2" /> Reset
                    </Button>
                    <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-700">Timeline Start:</span>
                        <Input
                            type="date"
                            value={viewStartDate.toISOString().split('T')[0]}
                            onChange={(e) => setViewStartDate(new Date(e.target.value))}
                            className="w-auto h-8"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <Button variant="outline" size="sm" onClick={handleExport} className="border-green-200 text-green-700 hover:bg-green-50">
                        <Download className="h-4 w-4 mr-2" /> Export Excel
                    </Button>
                    <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Save className="h-4 w-4 mr-2" /> Save Changes
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative m-4 border rounded-xl bg-white shadow-xl ring-1 ring-slate-100">
                {/* Fixed Left Column (Table) */}
                <div className="w-[500px] flex-shrink-0 flex flex-col border-r bg-white z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                    {/* Table Header */}
                    <div className="flex h-[50px] border-b bg-slate-50 font-semibold text-xs text-slate-700 tracking-tight">
                        <div className="w-12 flex items-center justify-center border-r border-slate-200">S.N</div>
                        <div className="flex-1 flex items-center px-4 border-r border-slate-200">Activity</div>
                        <div className="w-24 flex flex-col border-r border-slate-200">
                            <div className="border-b h-1/2 flex items-center justify-center bg-slate-100">From</div>
                            <div className="h-1/2 flex items-center justify-center bg-slate-100">To</div>
                        </div>
                        <div className="w-14 flex items-center justify-center bg-slate-100">Days</div>
                    </div>

                    {/* Table Rows */}
                    <ScrollArea className="flex-1">
                        {activities.map((activity) => (
                            <div key={activity.id} className={`flex h-[40px] border-b border-slate-100 hover:bg-blue-50/50 transition-colors group ${activity.isHeader ? 'bg-slate-50/80' : ''}`}>
                                <div className="w-12 flex items-center justify-center border-r border-slate-200 text-xs font-medium text-slate-600">
                                    <Input
                                        className="h-full w-full border-none bg-transparent p-0 text-center focus-visible:ring-0 text-xs shadow-none"
                                        value={activity.sn}
                                        onChange={(e) => handleUpdateActivity(activity.id, 'sn', e.target.value)}
                                    />
                                </div>
                                <div className="flex-1 border-r border-slate-200 px-3 flex items-center">
                                    <Input
                                        className={`h-full w-full border-none bg-transparent p-0 focus-visible:ring-0 text-xs shadow-none ${activity.isHeader ? 'font-bold text-slate-800' : 'text-slate-600'}`}
                                        value={activity.activity}
                                        onChange={(e) => handleUpdateActivity(activity.id, 'activity', e.target.value)}
                                    />
                                </div>
                                <div className="w-24 border-r border-slate-200 flex flex-col">
                                    <input
                                        type="date"
                                        className="h-1/2 w-full text-[10px] border-none bg-transparent px-1 focus:outline-none text-slate-500 font-mono tracking-tighter"
                                        value={activity.startDate}
                                        onChange={(e) => handleUpdateActivity(activity.id, 'startDate', e.target.value)}
                                    />
                                    <input
                                        type="date"
                                        className="h-1/2 w-full text-[10px] border-none bg-transparent px-1 border-t border-slate-100 focus:outline-none text-slate-500 font-mono tracking-tighter"
                                        value={activity.endDate}
                                        onChange={(e) => handleUpdateActivity(activity.id, 'endDate', e.target.value)}
                                    />
                                </div>
                                <div className="w-14 flex items-center justify-center text-xs font-semibold text-slate-700 bg-slate-50/30">
                                    {getDuration(activity.startDate, activity.endDate)}
                                </div>
                            </div>
                        ))}
                    </ScrollArea>
                </div>

                {/* Right Scrollable Timeline */}
                <ScrollArea className="flex-1 bg-white">
                    <div className="flex flex-col min-w-max">
                        {/* Timeline Header */}
                        <div className="h-[50px] flex border-b bg-slate-50 sticky top-0 z-10 font-semibold text-xs text-slate-700">
                            {timelineHeaders.months.map((month, idx) => (
                                <div key={idx} className="flex flex-col border-r border-slate-200 h-full" style={{ width: month.days * cellWidth }}>
                                    <div className="h-1/2 flex items-center justify-center bg-slate-100 border-b border-slate-200 text-slate-800">
                                        {month.label}
                                    </div>
                                    <div className="flex h-1/2 bg-slate-50/50">
                                        {/* Simplified days placeholder */}
                                        <div className="w-full h-full"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Timeline Grid & Bars */}
                        <div className="relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 pointer-events-none z-0 flex">
                                {timelineHeaders.days.map((day, idx) => (
                                    <div key={idx} className="border-r border-dashed border-slate-100 h-full" style={{ width: cellWidth }}></div>
                                ))}
                            </div>

                            {/* Activity Bars */}
                            {activities.map((activity) => {
                                const { left, width } = getBarPosition(activity.startDate, activity.endDate);
                                return (
                                    <div key={activity.id} className="h-[40px] border-b border-slate-100 relative z-10 hover:bg-blue-50/20 transition-colors">
                                        {width > 0 && left + width > 0 && (
                                            <div
                                                className={`absolute h-[20px] top-[10px] rounded-[1px] shadow-sm transition-all duration-300
                                                    ${activity.isHeader ? 'bg-amber-300 border border-amber-400' : 'bg-yellow-400 border border-yellow-500'}
                                                `}
                                                style={{ left: `${Math.max(0, left)}px`, width: `${width}px` }}
                                            >
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}

export default ProjectGanttChart;
