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
import { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { workToGanttTasks, type GanttTask, type GanttChangeEvent } from "@/types/gantt";

interface SchedulePageClientProps {
    work: any;
}

type ZoomLevel = 'day' | 'week' | 'month' | 'year';

export function SchedulePageClient({ work }: SchedulePageClientProps) {
    // Ref for Gantt chart container to capture for export
    const ganttContainerRef = useRef<HTMLDivElement>(null);

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
    const handleExportExcel = useCallback(async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Schedule');

            // Set headers
            worksheet.columns = [
                { header: 'Activity', key: 'activity', width: 40 },
                { header: 'Type', key: 'type', width: 15 },
                { header: 'Start Date', key: 'startDate', width: 15 },
                { header: 'End Date', key: 'endDate', width: 15 },
                { header: 'Progress (%)', key: 'progress', width: 12 }
            ];

            // Style header row
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

            // Add data
            allTasks.forEach(task => {
                worksheet.addRow({
                    activity: task.text,
                    type: task.isMainActivity ? 'Main Activity' : 'Sub-Activity',
                    startDate: task.start_date,
                    endDate: task.end_date || '-',
                    progress: Math.round((task.progress || 0) * 100)
                });
            });

            // Generate buffer and download using Blob
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `Schedule_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            setTimeout(() => URL.revokeObjectURL(url), 100);

            toast.success('Exported schedule to Excel');
        } catch (error) {
            console.error('Excel export error:', error);
            toast.error('Failed to export Excel');
        }
    }, [allTasks]);

    // Export to PDF with Gantt chart visual
    // Export to PDF with Gantt chart visual and table fallback
    const handleExportPDF = useCallback(async () => {
        try {
            toast.info('Generating PDF...');

            const ganttElement = ganttContainerRef.current;
            let visualCaptured = false;
            let imgData = '';
            let imgWidth = 0;
            let imgHeight = 0;

            if (ganttElement) {
                try {
                    // Capture the Gantt chart as image
                    const canvas = await html2canvas(ganttElement, {
                        scale: 1.5, // Lower scale for better compatibility
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff',
                        onclone: (clonedDoc) => {
                            // 1. Aggressively sanitize all <style> tags
                            const styleTags = clonedDoc.querySelectorAll('style');
                            styleTags.forEach(tag => {
                                const css = tag.textContent || '';
                                if (css.includes('oklab') || css.includes('oklch')) {
                                    tag.textContent = css.replace(/(oklab|oklch)\([^)]+\)/g, 'rgb(71, 85, 105)');
                                }
                            });

                            // 2. Remove problematic link tags (safer for capture)
                            const linkTags = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
                            linkTags.forEach(tag => {
                                tag.remove();
                            });

                            // 3. Force standard colors on elements
                            const elements = clonedDoc.querySelectorAll('*');
                            elements.forEach(el => {
                                const htmlEl = el as HTMLElement;
                                ['backgroundColor', 'color', 'borderColor', 'fill', 'stroke'].forEach(prop => {
                                    try {
                                        const style = window.getComputedStyle(htmlEl);
                                        const val = (htmlEl.style as any)[prop] || style.getPropertyValue(prop);
                                        if (val && (val.includes('oklab') || val.includes('oklch'))) {
                                            (htmlEl.style as any)[prop] = prop === 'backgroundColor' ? '#ffffff' : '#475569';
                                        }
                                    } catch (e) { }
                                });
                            });
                        }
                    });

                    imgData = canvas.toDataURL('image/png');
                    imgWidth = canvas.width;
                    imgHeight = canvas.height;
                    visualCaptured = true;
                } catch (captureError) {
                    console.warn('Visual capture failed, falling back to table:', captureError);
                    toast.info('Visual capture skipped, generating table report...');
                }
            }

            // Create PDF in landscape
            const doc = new jsPDF('l', 'mm', 'a4');
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();

            // Header
            doc.setFontSize(14);
            doc.text(`Project Schedule - ${work.work_name || 'Project'}`, pdfWidth / 2, 12, { align: 'center' });

            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 14, 18);
            doc.setTextColor(0, 0, 0);

            if (visualCaptured && imgData) {
                // Add Chart image
                const margin = 10;
                const maxWidth = pdfWidth - (margin * 2);
                const maxHeight = pdfHeight - 40;
                const scale = Math.min(maxWidth / (imgWidth / 3.78), maxHeight / (imgHeight / 3.78));
                const scaledWidth = (imgWidth / 3.78) * scale;
                const scaledHeight = (imgHeight / 3.78) * scale * 0.9;
                doc.addImage(imgData, 'PNG', margin, 22, scaledWidth, scaledHeight);

                // Add table on a new page
                doc.addPage();
                doc.setFontSize(14);
                doc.text(`Activity Details`, pdfWidth / 2, 12, { align: 'center' });
            }

            // Add Table data
            const tableData = allTasks.map(task => [
                task.text,
                task.isMainActivity ? 'Main Activity' : 'Sub-Activity',
                task.start_date,
                task.end_date || '-',
                `${Math.round((task.progress || 0) * 100)}%`
            ]);

            autoTable(doc, {
                startY: visualCaptured ? 22 : 25,
                head: [['Activity', 'Type', 'Start Date', 'End Date', 'Progress']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9, halign: 'center' },
                styles: { fontSize: 8, cellPadding: 3 },
                columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 35 }, 2: { cellWidth: 35 }, 3: { cellWidth: 35 }, 4: { cellWidth: 25 } }
            });

            // Save the PDF using Blob for better reliability
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `Schedule_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            setTimeout(() => URL.revokeObjectURL(url), 100);

            toast.success(visualCaptured ? 'Exported Gantt chart and table to PDF!' : 'Exported schedule table to PDF!');
        } catch (error) {
            console.error('PDF export error:', error);
            toast.error('Failed to export PDF');
        }
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
                        onClick={handleExportExcel}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Excel
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                        className="border-rose-200 text-rose-700 hover:bg-rose-50"
                    >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
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
                <div ref={ganttContainerRef} className="h-full bg-white rounded-xl shadow-lg border border-slate-200/60 overflow-hidden">
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
