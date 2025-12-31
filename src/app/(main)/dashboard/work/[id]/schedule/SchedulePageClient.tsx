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
    const [showMobileView, setShowMobileView] = useState(false);

    // Detect mobile on mount
    useEffect(() => {
        const checkMobile = () => setShowMobileView(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load saved schedule data from Supabase
    useEffect(() => {
        const loadSavedData = async () => {
            if (!work?.id) {
                setIsLoading(false);
                return;
            }
            try {
                const result = await loadScheduleData(Number(work.id));
                if (result.success && result.data) {
                    const parsed = JSON.parse(result.data);
                    if (parsed.customTasks) {
                        setCustomTasks(parsed.customTasks);
                    }
                    if (parsed.deletedTaskIds) {
                        setDeletedTaskIds(new Set(parsed.deletedTaskIds));
                    }
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to load schedule data:', error);
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
        
        // Create a map of custom tasks for quick lookup
        const customTasksMap = new Map(customTasks.map(t => [String(t.id), t]));
        
        // Merge base tasks with custom updates
        const mergedBaseTasks = baseTasks
            .filter(t => !deletedTaskIds.has(String(t.id)))
            .map(baseTask => {
                const customUpdate = customTasksMap.get(String(baseTask.id));
                if (customUpdate) {
                    // Remove from map as we've used it
                    customTasksMap.delete(String(baseTask.id));
                    return customUpdate;
                }
                return baseTask;
            });
        
        // Add remaining custom tasks (new ones not in base)
        const remainingCustomTasks = Array.from(customTasksMap.values());
        
        return [...mergedBaseTasks, ...remainingCustomTasks];
    }, [baseTasks, customTasks, deletedTaskIds, isLoading]);

    // Handle task changes
    const handleTaskChange = useCallback((event: GanttChangeEvent) => {
        setPendingChanges(prev => [...prev, event]);

        if (event.type === 'add' && event.task) {
            setCustomTasks(prev => [...prev, event.task!]);
        } else if (event.type === 'update' && event.task) {
            // Update both customTasks and baseTasks
            setCustomTasks(prev =>
                prev.map(t => t.id === event.task!.id ? event.task! : t)
            );
            // Force re-render by updating the task in allTasks
            const taskId = event.task.id;
            const isBaseTask = baseTasks.some(t => t.id === taskId);
            if (isBaseTask) {
                // Store the update for base tasks too
                setCustomTasks(prev => {
                    const existing = prev.find(t => t.id === taskId);
                    if (existing) {
                        return prev.map(t => t.id === taskId ? event.task! : t);
                    } else {
                        return [...prev, event.task!];
                    }
                });
            }
        } else if (event.type === 'delete' && event.taskId) {
            setCustomTasks(prev => prev.filter(t => t.id !== event.taskId));
            setDeletedTaskIds(prev => new Set(prev).add(String(event.taskId)));
        }
    }, [baseTasks]);

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
            console.log('[SchedulePageClient] Saving schedule');
            console.log('[SchedulePageClient] allTasks:', allTasks.length);
            
            const scheduleData = JSON.stringify({
                customTasks: allTasks,
                deletedTaskIds: Array.from(deletedTaskIds)
            });

            const workId = Number(work.id);
            
            // Save to Supabase
            console.log('[SchedulePageClient] Calling saveScheduleData');
            const result = await saveScheduleData(workId, scheduleData);
            console.log('[SchedulePageClient] Save result:', result);
            
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
                const errorMsg = result.error || 'Failed to save';
                console.error('Save failed:', errorMsg);
                toast.error(`Save failed: ${errorMsg}`);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error('Save failed:', errorMsg);
            toast.error(`Save failed: ${errorMsg}`);
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
            const doc = new jsPDF('l', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Bar chart for ${work.work_name || 'Construction work'}`, pageWidth / 2, 10, { align: 'center' });
            
            const mainActivities = allTasks.filter(t => t.isMainActivity || t.type === 'project');
            const allTasksFlat: any[] = [];
            
            let mainIndex = 0;
            mainActivities.forEach(mainTask => {
                mainIndex++;
                allTasksFlat.push({ ...mainTask, level: 0, label: mainTask.text, serialNo: String.fromCharCode(64 + mainIndex) });
                const subActivities = allTasks.filter(t => t.parent === mainTask.id);
                let subIndex = 0;
                subActivities.forEach(subTask => {
                    subIndex++;
                    allTasksFlat.push({ ...subTask, level: 1, label: subTask.text, serialNo: `${subIndex}` });
                });
            });

            const dates = allTasksFlat.map(t => new Date(t.start_date));
            const endDates = allTasksFlat.filter(t => t.end_date).map(t => new Date(t.end_date));
            const minTaskDate = new Date(Math.min(...dates.map(d => d.getTime())));
            const maxTaskDate = new Date(Math.max(...endDates.map(d => d.getTime())));
            
            // Set minDate to first day of month
            const minDate = new Date(minTaskDate.getFullYear(), minTaskDate.getMonth(), 1);
            // Set maxDate to last day of month
            const maxDate = new Date(maxTaskDate.getFullYear(), maxTaskDate.getMonth() + 1, 0);
            
            const months: Date[] = [];
            let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
            while (current <= maxDate) {
                months.push(new Date(current));
                current.setMonth(current.getMonth() + 1);
            }

            const startY = 20;
            const rowHeight = 6;
            const colWidths = [12, 45, 18, 18, 12, 15];
            const chartStartX = colWidths.reduce((a, b) => a + b, 0) + 5;
            const monthWidth = (pageWidth - chartStartX - 10) / months.length;

            // Function to draw header
            const drawHeader = (yPos: number) => {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                
                let headerX = 5;
                ['S.N', 'Activity', 'Date From', 'Date To', 'Days', 'Progress'].forEach((header, i) => {
                    doc.rect(headerX, yPos, colWidths[i], rowHeight);
                    doc.text(header, headerX + colWidths[i] / 2, yPos + 4, { align: 'center' });
                    headerX += colWidths[i];
                });

                months.forEach((month, i) => {
                    const monthX = chartStartX + i * monthWidth;
                    doc.rect(monthX, yPos, monthWidth, rowHeight);
                    doc.setFontSize(7);
                    const monthStr = month.toLocaleDateString('en-US', { month: 'short' });
                    const yearStr = month.getFullYear().toString().slice(-2);
                    doc.text(`${monthStr}-${yearStr}`, monthX + monthWidth / 2, yPos + 4, { align: 'center' });
                });
                
                return yPos + rowHeight;
            };

            let y = drawHeader(startY);

            doc.setFont('helvetica', 'normal');
            allTasksFlat.forEach((task, idx) => {
                const startDate = new Date(task.start_date);
                const endDate = task.end_date ? new Date(task.end_date) : startDate;
                const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                let x = 5;
                
                // Set font size based on level
                if (task.level === 0) {
                    doc.setFontSize(8);
                    doc.setFillColor(224, 242, 254); // Light blue background for main
                    doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
                } else {
                    doc.setFontSize(7);
                }
                
                doc.rect(x, y, colWidths[0], rowHeight);
                doc.text(task.serialNo, x + colWidths[0] / 2, y + 4, { align: 'center' });
                x += colWidths[0];

                doc.rect(x, y, colWidths[1], rowHeight);
                if (task.level === 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.text(task.label, x + 2, y + 4, { maxWidth: colWidths[1] - 4 });
                    doc.setFont('helvetica', 'normal');
                } else {
                    doc.text(`    ${task.label}`, x + 2, y + 4, { maxWidth: colWidths[1] - 4 });
                }
                x += colWidths[1];

                doc.rect(x, y, colWidths[2], rowHeight);
                doc.text(startDate.toLocaleDateString('en-GB'), x + colWidths[2] / 2, y + 4, { align: 'center' });
                x += colWidths[2];

                doc.rect(x, y, colWidths[3], rowHeight);
                doc.text(endDate.toLocaleDateString('en-GB'), x + colWidths[3] / 2, y + 4, { align: 'center' });
                x += colWidths[3];

                doc.rect(x, y, colWidths[4], rowHeight);
                doc.text(String(days), x + colWidths[4] / 2, y + 4, { align: 'center' });
                x += colWidths[4];

                // Progress
                doc.rect(x, y, colWidths[5], rowHeight);
                doc.text(`${Math.round((task.progress || 0) * 100)}%`, x + colWidths[5] / 2, y + 4, { align: 'center' });

                // Draw chart grid with light borders
                doc.setDrawColor(220, 220, 220); // Light gray
                months.forEach((month, i) => {
                    const monthX = chartStartX + i * monthWidth;
                    doc.rect(monthX, y, monthWidth, rowHeight);
                });
                doc.setDrawColor(0, 0, 0); // Reset to black

                const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
                const startDayOffset = (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
                const endDayOffset = (endDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
                
                const chartWidth = months.length * monthWidth;
                const barX = chartStartX + (startDayOffset / totalDays) * chartWidth;
                const barEndX = chartStartX + (endDayOffset / totalDays) * chartWidth;
                const barWidth = barEndX - barX;
                
                // Draw background bar (scheduled)
                if (task.level === 0) {
                    doc.setFillColor(245, 158, 11); // Orange for main
                } else {
                    doc.setFillColor(147, 197, 253); // Light blue for sub planned
                }
                doc.rect(barX, y + 1, barWidth, rowHeight - 2, 'F');
                
                // Draw progress bar (completed)
                const progress = task.progress || 0;
                if (progress > 0) {
                    if (task.level === 0) {
                        doc.setFillColor(16, 185, 129); // Green for main progress
                    } else {
                        doc.setFillColor(37, 99, 235); // Dark blue for sub completed
                    }
                    const progressWidth = barWidth * progress;
                    doc.rect(barX, y + 1, progressWidth, rowHeight - 2, 'F');
                    
                    // Show progress percentage on bar if space available
                    if (progressWidth > 10) {
                        doc.setFontSize(6);
                        doc.setTextColor(255, 255, 255);
                        doc.text(`${Math.round(progress * 100)}%`, barX + progressWidth / 2, y + 4, { align: 'center' });
                        doc.setTextColor(0, 0, 0);
                    }
                }

                y += rowHeight;
                
                if (y > pageHeight - 20) {
                    doc.addPage();
                    y = drawHeader(20);
                }
            });
            
            // Add footer on last page
            const now = new Date();
            const dateTimeStr = now.toLocaleString('en-IN', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(`Generated by: ${work.user_name || 'User'} | ${dateTimeStr}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.setTextColor(0);
            
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
                        {/* Zoom controls - Fixed position */}
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
                            <span className="px-1 sm:px-2 text-[10px] sm:text-xs font-medium text-slate-600 capitalize w-[70px] sm:w-[80px] text-center">
                                {zoom === 'alternate_day' ? 'Alt Day' : zoom}
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

                        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                        {/* Action buttons */}
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

            {/* Gantt Chart or Mobile View */}
            <div className="flex-1 p-2 sm:p-4 md:p-6 min-h-[400px] sm:min-h-[500px] md:min-h-[600px]">
                {showMobileView ? (
                    <div className="space-y-4">
                        {/* Add Activity Buttons */}
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200/60 p-4">
                            <h3 className="text-lg font-bold text-slate-900 mb-3">Manage Activities</h3>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleAddMainActivity}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Main Activity
                                </Button>
                                <Button
                                    onClick={handleAddSubActivity}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Sub-Activity
                                </Button>
                            </div>
                            {pendingChanges.length > 0 && (
                                <Button
                                    onClick={handleSave}
                                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes ({pendingChanges.length})
                                </Button>
                            )}
                        </div>

                        {/* Activities List */}
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200/60 p-4">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Activities</h3>
                            <div className="space-y-3">
                                {allTasks.filter(t => t.isMainActivity || t.type === 'project').map(mainTask => (
                                    <div key={mainTask.id} className="border border-slate-200 rounded-lg p-4">
                                        <div className="font-semibold text-slate-900 mb-2">{mainTask.text}</div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                                            <div>Start: {mainTask.start_date ? new Date(mainTask.start_date).toLocaleDateString('en-GB') : '-'}</div>
                                            <div>End: {mainTask.end_date ? new Date(mainTask.end_date).toLocaleDateString('en-GB') : '-'}</div>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div 
                                                className="bg-teal-500 h-2 rounded-full" 
                                                style={{ width: `${Math.round((mainTask.progress || 0) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-slate-600 mt-1 text-right">
                                            {Math.round((mainTask.progress || 0) * 100)}%
                                        </div>
                                        {allTasks.filter(t => t.parent === mainTask.id).length > 0 && (
                                            <div className="mt-3 pl-4 space-y-2 border-l-2 border-slate-200">
                                                {allTasks.filter(t => t.parent === mainTask.id).map(subTask => (
                                                    <div key={subTask.id} className="text-sm">
                                                        <div className="text-slate-700 mb-1">• {subTask.text}</div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                                                <div 
                                                                    className="bg-blue-500 h-1.5 rounded-full" 
                                                                    style={{ width: `${Math.round((subTask.progress || 0) * 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-slate-600">
                                                                {Math.round((subTask.progress || 0) * 100)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Timeline Information Card */}
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200/60 p-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-slate-900">Timeline Information</h2>
                                    <p className="text-sm text-slate-600 mt-1">Project schedule and milestones</p>
                                </div>
                                <Button
                                    size="sm"
                                    className="bg-teal-600 hover:bg-teal-700 text-white"
                                    onClick={handleExportPDF}
                                >
                                    Detailed Schedule
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                    <span className="text-sm text-slate-600">Date of Start</span>
                                    <span className="text-sm font-semibold text-slate-900">
                                        {work.wom_date ? new Date(work.wom_date).toLocaleDateString('en-GB') : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                    <span className="text-sm text-slate-600">Scheduled Date of Completion</span>
                                    <span className="text-sm font-semibold text-slate-900">
                                        {work.expected_completion_date ? new Date(work.expected_completion_date).toLocaleDateString('en-GB') : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                    <span className="text-sm text-slate-600">Expected Date of Completion</span>
                                    <span className="text-sm font-semibold text-slate-900">
                                        {work.expected_completion_date ? new Date(work.expected_completion_date).toLocaleDateString('en-GB') : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                    <span className="text-sm text-slate-600">Actual Date of Completion</span>
                                    <span className="text-sm font-semibold text-slate-900">
                                        {work.completion_date ? new Date(work.completion_date).toLocaleDateString('en-GB') : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                    <span className="text-sm text-slate-600">Current Progress</span>
                                    <span className="text-sm font-semibold text-teal-600">
                                        {allTasks.length > 0 ? Math.round(allTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / allTasks.length * 100) : 0}%
                                    </span>
                                </div>
                                <div className="pt-3">
                                    <span className="text-sm text-slate-600 block mb-2">Remark</span>
                                    <p className="text-sm text-slate-900">{work.reason || 'Work has been started'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div ref={ganttContainerRef} className="h-full bg-white rounded-lg sm:rounded-xl shadow-lg border border-slate-200/60 overflow-auto">
                        <GanttChartWrapper
                            tasks={allTasks}
                            onTaskChange={handleTaskChange}
                            onLinkChange={handleLinkChange}
                            zoom={zoom}
                            height="100%"
                        />
                    </div>
                )}
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
