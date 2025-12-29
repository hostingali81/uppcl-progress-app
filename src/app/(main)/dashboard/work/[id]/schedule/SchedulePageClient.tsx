"use client";


import { db } from "@/lib/db/schema";
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
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { workToGanttTasks, type GanttTask, type GanttChangeEvent } from "@/types/gantt";
import { saveScheduleData, loadScheduleData } from './actions';

interface SchedulePageClientProps {
    work: any;
}

type ZoomLevel = 'day' | 'week' | 'month' | 'year' | 'quarter_day' | 'alternate_day';

export function SchedulePageClient({ work }: SchedulePageClientProps) {
    // Ref for Gantt chart container to capture for export
    const ganttContainerRef = useRef<HTMLDivElement>(null);

    // State
    const [zoom, setZoom] = useState<ZoomLevel>('month');
    const [pendingChanges, setPendingChanges] = useState<GanttChangeEvent[]>([]);
    const [customTasks, setCustomTasks] = useState<GanttTask[]>([]);
    const [deletedTaskIds, setDeletedTaskIds] = useState<Set<string | number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    // Load saved schedule data from Supabase
    useEffect(() => {
        const loadSavedData = async () => {
            if (!work?.id) {
                setIsLoading(false);
                return;
            }
            try {
                // Try loading from Supabase first
                const result = await loadScheduleData(Number(work.id));
                
                if (result.success && result.data) {
                    const data = JSON.parse(result.data);
                    if (data.customTasks) setCustomTasks(data.customTasks);
                    if (data.deletedTaskIds) {
                        const idsAsStrings = data.deletedTaskIds.map((id: any) => String(id));
                        setDeletedTaskIds(new Set(idsAsStrings));
                    }
                    toast.success('Restored saved schedule');
                } else {
                    // Fallback to IndexedDB
                    let localWork = await db.works.get(Number(work.id));
                    if (localWork?.schedule_data) {
                        const data = JSON.parse(localWork.schedule_data);
                        if (data.customTasks) setCustomTasks(data.customTasks);
                        if (data.deletedTaskIds) {
                            const idsAsStrings = data.deletedTaskIds.map((id: any) => String(id));
                            setDeletedTaskIds(new Set(idsAsStrings));
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load schedule data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSavedData();
    }, [work.id]);

    // Transform work data to Gantt tasks
    const baseTasks = useMemo(() => workToGanttTasks(work), [work]);

    // Combine base tasks with any custom tasks, filtering out deleted ones
    const allTasks = useMemo(() => {
        if (isLoading) return [];
        const activeBaseTasks = baseTasks.filter(t => !deletedTaskIds.has(String(t.id)));
        return [...activeBaseTasks, ...customTasks];
    }, [baseTasks, customTasks, deletedTaskIds, isLoading]);

    // Handle task changes
    const handleTaskChange = useCallback((event: GanttChangeEvent) => {
        setPendingChanges(prev => [...prev, event]);

        if (event.type === 'add' && event.task) {
            setCustomTasks(prev => [...prev, event.task!]);
        } else if (event.type === 'update' && event.task) {
            setCustomTasks(prev =>
                prev.map(t => t.id === event.task!.id ? event.task! : t)
            );
        } else if (event.type === 'delete' && event.taskId) {
            setCustomTasks(prev => prev.filter(t => t.id !== event.taskId));
            setDeletedTaskIds(prev => new Set(prev).add(String(event.taskId)));
        }
    }, []);

    const handleLinkChange = useCallback((event: GanttChangeEvent) => {
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

    // Save changes to Supabase
    const handleSave = useCallback(async () => {
        if (pendingChanges.length === 0 && deletedTaskIds.size === 0) {
            toast.info('No changes to save');
            return;
        }

        try {
            const scheduleData = JSON.stringify({
                customTasks,
                deletedTaskIds: Array.from(deletedTaskIds)
            });

            const workId = Number(work.id);
            
            // Save to Supabase
            const result = await saveScheduleData(workId, scheduleData);
            
            if (result.success) {
                // Also save to IndexedDB for offline access
                const existing = await db.works.get(workId);
                if (existing) {
                    await db.works.update(workId, { schedule_data: scheduleData });
                } else {
                    await db.works.add({
                        id: workId,
                        region: work.region || '',
                        division: work.division || '',
                        subdivision: work.subdivision || '',
                        description: work.work_name || work.description || '',
                        wbs: work.wbs || '',
                        tender_amount: work.tender_amount || null,
                        tender_date: work.tender_date || null,
                        vendor: work.vendor || null,
                        time_period_in_days: work.time_period_in_days || null,
                        status: work.status || null,
                        reason: work.reason || null,
                        user_id: work.user_id || '',
                        created_at: work.created_at || new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        wom_date: work.wom_date || null,
                        completion_date: work.completion_date || null,
                        bill_no: work.bill_no || null,
                        bill_amount_with_tax: work.bill_amount_with_tax || null,
                        syncStatus: 'synced',
                        lastSyncAttempt: null,
                        syncError: null,
                        schedule_data: scheduleData
                    });
                }
                
                setPendingChanges([]);
                toast.success('Schedule saved successfully!');
            } else {
                throw new Error(result.error || 'Failed to save');
            }
        } catch (err) {
            console.error('Save failed:', err);
            toast.error('Failed to save changes.');
        }
    }, [pendingChanges, customTasks, deletedTaskIds, work]);

    // Export to Excel
    const handleExportExcel = useCallback(async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Schedule');

            // Add title row
            worksheet.mergeCells('A1:F1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = `Project Schedule - ${work.work_name || 'Project'}`;
            titleCell.font = { bold: true, size: 14 };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2980B9' } };
            titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
            worksheet.getRow(1).height = 25;

            // Set headers on row 2
            worksheet.getRow(2).values = ['Activity', 'Type', 'Start Date', 'End Date', 'Days', 'Progress (%)'];
            worksheet.columns = [
                { key: 'activity', width: 40 },
                { key: 'type', width: 15 },
                { key: 'startDate', width: 15 },
                { key: 'endDate', width: 15 },
                { key: 'days', width: 10 },
                { key: 'progress', width: 12 }
            ];

            // Style header row
            const headerRow = worksheet.getRow(2);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2980B9' }
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

            // Add data with proper hierarchy
            const mainActivities = allTasks.filter(t => t.isMainActivity || t.type === 'project');
            
            mainActivities.forEach(mainTask => {
                const startDate = mainTask.start_date ? new Date(mainTask.start_date) : null;
                const endDate = mainTask.end_date ? new Date(mainTask.end_date) : null;
                const days = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : '-';
                
                // Add main activity
                const mainRow = worksheet.addRow({
                    activity: mainTask.text,
                    type: 'Main',
                    startDate: startDate ? startDate.toLocaleDateString('en-GB') : '-',
                    endDate: endDate ? endDate.toLocaleDateString('en-GB') : '-',
                    days: days,
                    progress: Math.round((mainTask.progress || 0) * 100)
                });
                mainRow.font = { bold: true };
                mainRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F8FF' } };
                
                // Add sub-activities
                const subActivities = allTasks.filter(t => t.parent === mainTask.id);
                subActivities.forEach(subTask => {
                    const subStartDate = subTask.start_date ? new Date(subTask.start_date) : null;
                    const subEndDate = subTask.end_date ? new Date(subTask.end_date) : null;
                    const subDays = subStartDate && subEndDate ? Math.ceil((subEndDate.getTime() - subStartDate.getTime()) / (1000 * 60 * 60 * 24)) : '-';
                    
                    worksheet.addRow({
                        activity: `  • ${subTask.text}`,
                        type: 'Sub',
                        startDate: subStartDate ? subStartDate.toLocaleDateString('en-GB') : '-',
                        endDate: subEndDate ? subEndDate.toLocaleDateString('en-GB') : '-',
                        days: subDays,
                        progress: Math.round((subTask.progress || 0) * 100)
                    });
                });
            });

            // Center align specific columns
            worksheet.getColumn('type').alignment = { horizontal: 'center' };
            worksheet.getColumn('startDate').alignment = { horizontal: 'center' };
            worksheet.getColumn('endDate').alignment = { horizontal: 'center' };
            worksheet.getColumn('days').alignment = { horizontal: 'center' };
            worksheet.getColumn('progress').alignment = { horizontal: 'center' };

            // Generate buffer and download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `Schedule_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);

            toast.success('Exported schedule to Excel');
        } catch (error) {
            console.error('Excel export error:', error);
            toast.error('Failed to export Excel');
        }
    }, [allTasks]);

    const handleExportPDF = useCallback(async () => {
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = doc.internal.pageSize.getWidth();
            
            doc.setFontSize(14);
            doc.text(`Project Schedule - ${work.work_name || 'Project'}`, pdfWidth / 2, 12, { align: 'center' });
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 18);
            doc.setTextColor(0);
            
            // Group tasks by parent for proper hierarchy
            const mainActivities = allTasks.filter(t => t.isMainActivity || t.type === 'project');
            const tableData: any[] = [];
            
            mainActivities.forEach(mainTask => {
                const startDate = mainTask.start_date ? new Date(mainTask.start_date) : null;
                const endDate = mainTask.end_date ? new Date(mainTask.end_date) : null;
                const days = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : '-';
                
                // Add main activity
                tableData.push([
                    mainTask.text,
                    'Main',
                    startDate ? startDate.toLocaleDateString('en-GB') : '-',
                    endDate ? endDate.toLocaleDateString('en-GB') : '-',
                    days,
                    `${Math.round((mainTask.progress || 0) * 100)}%`
                ]);
                
                // Add sub-activities for this main activity
                const subActivities = allTasks.filter(t => t.parent === mainTask.id);
                subActivities.forEach(subTask => {
                    const subStartDate = subTask.start_date ? new Date(subTask.start_date) : null;
                    const subEndDate = subTask.end_date ? new Date(subTask.end_date) : null;
                    const subDays = subStartDate && subEndDate ? Math.ceil((subEndDate.getTime() - subStartDate.getTime()) / (1000 * 60 * 60 * 24)) : '-';
                    
                    tableData.push([
                        `  • ${subTask.text}`,
                        'Sub',
                        subStartDate ? subStartDate.toLocaleDateString('en-GB') : '-',
                        subEndDate ? subEndDate.toLocaleDateString('en-GB') : '-',
                        subDays,
                        `${Math.round((subTask.progress || 0) * 100)}%`
                    ]);
                });
            });
            
            autoTable(doc, {
                startY: 25,
                head: [['Activity', 'Type', 'Start Date', 'End Date', 'Days', 'Progress']],
                body: tableData,
                theme: 'grid',
                margin: { left: 5, right: 5 },
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9, halign: 'center', fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: { 
                    0: { cellWidth: 80, halign: 'left' }, 
                    1: { cellWidth: 20, halign: 'center' }, 
                    2: { cellWidth: 28, halign: 'center' }, 
                    3: { cellWidth: 28, halign: 'center' }, 
                    4: { cellWidth: 15, halign: 'center' }, 
                    5: { cellWidth: 20, halign: 'center' } 
                },
                didParseCell: (data) => {
                    // Bold and highlight main activities
                    if (data.section === 'body' && data.column.index === 1) {
                        if (data.cell.text[0] === 'Main') {
                            data.row.cells[0].styles.fontStyle = 'bold';
                            data.row.cells[0].styles.fillColor = [240, 248, 255];
                            data.row.cells[1].styles.fillColor = [240, 248, 255];
                        }
                    }
                }
            });
            
            doc.save(`Schedule_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('PDF exported successfully!');
            
        } catch (error) {
            console.error('PDF export error:', error);
            toast.error('Failed to export PDF');
        }
    }, [allTasks, work.work_name]);

    // Zoom controls
    const zoomIn = useCallback(() => {
        const levels: ZoomLevel[] = ['year', 'month', 'week', 'alternate_day', 'day'];
        const currentIndex = levels.indexOf(zoom);
        if (currentIndex < levels.length - 1) {
            setZoom(levels[currentIndex + 1]);
        }
    }, [zoom]);

    const zoomOut = useCallback(() => {
        const levels: ZoomLevel[] = ['year', 'month', 'week', 'alternate_day', 'day'];
        const currentIndex = levels.indexOf(zoom);
        if (currentIndex > 0) {
            setZoom(levels[currentIndex - 1]);
        }
    }, [zoom]);

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
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
                <div className="px-4 sm:px-6 pb-4 space-y-3">
                    {/* Add buttons row */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddMainActivity}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
                        >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden xs:inline">Main Activity</span>
                            <span className="xs:hidden">Main</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddSubActivity}
                            className="border-purple-200 text-purple-700 hover:bg-purple-50 text-xs sm:text-sm"
                        >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden xs:inline">Sub-Activity</span>
                            <span className="xs:hidden">Sub</span>
                        </Button>
                    </div>

                    {/* Zoom and action buttons row */}
                    <div className="flex flex-wrap items-center gap-2">
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
                                <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <span className="px-1 sm:px-2 text-[10px] sm:text-xs font-medium text-slate-600 capitalize min-w-[40px] sm:min-w-[50px] text-center">
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
                                <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        </div>

                        {/* Quick Intervals */}
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                            <Button
                                variant={zoom === 'day' ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setZoom('day')}
                                className="text-[10px] sm:text-xs h-7 px-1.5 sm:px-2"
                            >
                                Daily
                            </Button>
                            <Button
                                variant={zoom === 'month' ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setZoom('month')}
                                className="text-[10px] sm:text-xs h-7 px-1.5 sm:px-2"
                            >
                                Monthly
                            </Button>
                        </div>

                        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                        {/* Action buttons */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm h-7 px-2 sm:px-3"
                        >
                            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Reset</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportExcel}
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm h-7 px-2 sm:px-3"
                        >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Excel</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPDF}
                            className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs sm:text-sm h-7 px-2 sm:px-3"
                        >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">PDF</span>
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={pendingChanges.length === 0}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg disabled:opacity-50 text-xs sm:text-sm h-7 px-2 sm:px-3"
                        >
                            <Save className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Save</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Gantt Chart - Flexible height */}
            <div className="flex-1 p-2 sm:p-4 md:p-6 min-h-[400px] sm:min-h-[500px] md:min-h-[600px]">
                <div ref={ganttContainerRef} className="h-full bg-white rounded-lg sm:rounded-xl shadow-lg border border-slate-200/60 overflow-auto">
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
            <div className="px-2 sm:px-4 md:px-6 pb-4 sm:pb-6">
                <div className="bg-slate-50 border border-slate-200/60 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <h3 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">How to Edit</h3>
                    <ul className="text-xs sm:text-sm text-slate-600 space-y-1">
                        <li>• <strong>Drag bars</strong> horizontally to change dates</li>
                        <li>• <strong>Resize bar edges</strong> to change duration</li>
                        <li>• <strong>Double-click</strong> a task to edit details in popup</li>
                        <li className="hidden sm:list-item">• <strong>Drag progress handle</strong> on bar to update completion</li>
                        <li className="hidden sm:list-item">• Click the <strong>+ button</strong> in the grid to add a sub-task</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
