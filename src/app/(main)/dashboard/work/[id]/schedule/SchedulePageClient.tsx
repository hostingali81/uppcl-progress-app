"use client";

import { GanttChartWrapper } from "@/components/custom/GanttChartWrapper";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Download,
    Save,
    Calendar,
    Plus,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Trash2
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { workToGanttTasks, type GanttTask, type GanttChangeEvent } from "@/types/gantt";

interface SchedulePageClientProps {
    work: any;
}

type ZoomLevel = 'day' | 'week' | 'month' | 'year';

export function SchedulePageClient({ work }: SchedulePageClientProps) {
    // State
    const [zoom, setZoom] = useState<ZoomLevel>('month');
    const [pendingChanges, setPendingChanges] = useState<GanttChangeEvent[]>([]);
    const [customTasks, setCustomTasks] = useState<GanttTask[]>([]);

    // Transform work data to Gantt tasks
    const baseTasks = useMemo(() => workToGanttTasks(work), [work]);

    // Combine base tasks with any custom tasks
    const allTasks = useMemo(() => {
        return [...baseTasks, ...customTasks];
    }, [baseTasks, customTasks]);

    // Handle task changes
    const handleTaskChange = useCallback((event: GanttChangeEvent) => {
        console.log('Task change:', event);
        setPendingChanges(prev => [...prev, event]);

        // Update local state for custom tasks
        if (event.type === 'add' && event.task) {
            setCustomTasks(prev => [...prev, event.task!]);
        } else if (event.type === 'update' && event.task) {
            setCustomTasks(prev =>
                prev.map(t => t.id === event.task!.id ? event.task! : t)
            );
        } else if (event.type === 'delete' && event.taskId) {
            setCustomTasks(prev =>
                prev.filter(t => t.id !== event.taskId)
            );
        }
    }, []);

    // Handle link changes (for future dependencies)
    const handleLinkChange = useCallback((event: GanttChangeEvent) => {
        console.log('Link change:', event);
        setPendingChanges(prev => [...prev, event]);
    }, []);

    // Add new main activity
    const handleAddMainActivity = useCallback(() => {
        const newId = `main-${Date.now()}`;
        const today = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const newTask: GanttTask = {
            id: newId,
            text: 'New Main Activity',
            start_date: today,
            end_date: endDate,
            progress: 0,
            open: true,
            type: 'project',
            isMainActivity: true
        };

        setCustomTasks(prev => [...prev, newTask]);
        setPendingChanges(prev => [...prev, {
            type: 'add',
            task: newTask,
            timestamp: new Date()
        }]);

        toast.success('Added new main activity');
    }, []);

    // Add new sub-activity
    const handleAddSubActivity = useCallback(() => {
        // Find first main activity to be parent
        const parentTask = allTasks.find(t => t.isMainActivity || t.type === 'project');
        if (!parentTask) {
            toast.error('Please add a main activity first');
            return;
        }

        const newId = `sub-${Date.now()}`;
        const today = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const newTask: GanttTask = {
            id: newId,
            text: 'New Sub-Activity',
            start_date: today,
            end_date: endDate,
            progress: 0,
            parent: parentTask.id,
            isMainActivity: false
        };

        setCustomTasks(prev => [...prev, newTask]);
        setPendingChanges(prev => [...prev, {
            type: 'add',
            task: newTask,
            timestamp: new Date()
        }]);

        toast.success('Added new sub-activity');
    }, [allTasks]);

    // Reset to original data
    const handleReset = useCallback(() => {
        setCustomTasks([]);
        setPendingChanges([]);
        toast.info('Reset to original schedule');
    }, []);

    // Save changes (prepared for future API integration)
    const handleSave = useCallback(async () => {
        if (pendingChanges.length === 0) {
            toast.info('No changes to save');
            return;
        }

        console.log('Saving changes:', pendingChanges);

        // TODO: Implement API call to save changes
        // const response = await fetch(`/api/works/${work.id}/schedule`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ changes: pendingChanges })
        // });

        // For now, just clear pending changes and show success
        setPendingChanges([]);
        toast.success(`Saved ${pendingChanges.length} change(s) successfully!`);
    }, [pendingChanges]);

    // Export to Excel
    const handleExport = useCallback(() => {
        const exportData = allTasks.map(task => ({
            'Activity': task.text,
            'Type': task.isMainActivity ? 'Main Activity' : 'Sub-Activity',
            'Start Date': task.start_date,
            'End Date': task.end_date || '',
            'Duration': task.duration || '',
            'Progress (%)': Math.round((task.progress || 0) * 100),
            'Parent': task.parent || ''
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Schedule");
        XLSX.writeFile(wb, `${work.work_name || 'Project'}_Schedule.xlsx`);

        toast.success('Exported schedule to Excel');
    }, [allTasks, work.work_name]);

    // Zoom controls
    const zoomIn = useCallback(() => {
        const levels: ZoomLevel[] = ['year', 'month', 'week', 'day'];
        const currentIndex = levels.indexOf(zoom);
        if (currentIndex < levels.length - 1) {
            setZoom(levels[currentIndex + 1]);
        }
    }, [zoom]);

    const zoomOut = useCallback(() => {
        const levels: ZoomLevel[] = ['year', 'month', 'week', 'day'];
        const currentIndex = levels.indexOf(zoom);
        if (currentIndex > 0) {
            setZoom(levels[currentIndex - 1]);
        }
    }, [zoom]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm sticky top-0 z-30">
                <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link href={`/dashboard/work/${work.id}`}>
                                <EnhancedButton
                                    variant="outline"
                                    size="icon"
                                    aria-label="Back to Work Details"
                                    className="border-slate-200 hover:bg-slate-50"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </EnhancedButton>
                            </Link>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                                    Project Schedule
                                </h1>
                                <p className="text-sm text-slate-600 mt-1">
                                    {work.work_name || 'Project Timeline'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Calendar className="h-5 w-5 text-blue-600 hidden sm:block" />
                            <span className="text-sm text-slate-600 hidden sm:block">
                                {work.site_name || 'Project Site'}
                            </span>
                            {pendingChanges.length > 0 && (
                                <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                    {pendingChanges.length} unsaved
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="px-4 sm:px-6 pb-4 flex flex-wrap items-center gap-2">
                    {/* Add buttons */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddMainActivity}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Main Activity
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddSubActivity}
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Sub-Activity
                    </Button>

                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                    {/* Zoom controls */}
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={zoomOut}
                            disabled={zoom === 'year'}
                            className="h-7 w-7 p-0"
                            title="Zoom Out"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="px-2 text-xs font-medium text-slate-600 capitalize min-w-[50px] text-center">
                            {zoom}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={zoomIn}
                            disabled={zoom === 'day'}
                            className="h-7 w-7 p-0"
                            title="Zoom In"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                    {/* Action buttons */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={pendingChanges.length === 0}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                    </Button>
                </div>
            </div>

            {/* Gantt Chart */}
            <div className="h-[calc(100vh-200px)] p-4 sm:p-6">
                <div className="h-full bg-white rounded-xl shadow-lg border border-slate-200/60 overflow-hidden">
                    <GanttChartWrapper
                        tasks={allTasks}
                        onTaskChange={handleTaskChange}
                        onLinkChange={handleLinkChange}
                        zoom={zoom}
                        height="100%"
                    />
                </div>
            </div>

            {/* Instructions */}
            <div className="px-4 sm:px-6 pb-6">
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-800 mb-2">How to Edit</h3>
                    <ul className="text-sm text-slate-600 space-y-1">
                        <li>• <strong>Drag bars</strong> horizontally to change dates</li>
                        <li>• <strong>Resize bar edges</strong> to change duration</li>
                        <li>• <strong>Double-click</strong> a task to edit details in popup</li>
                        <li>• <strong>Drag progress handle</strong> on bar to update completion</li>
                        <li>• Click the <strong>+ button</strong> in the grid to add a sub-task</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
