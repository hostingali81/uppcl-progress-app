"use client";

import dynamic from 'next/dynamic';
import { Loader2, BarChart3 } from 'lucide-react';
import type { GanttChartProps } from '@/types/gantt';

// Loading skeleton component
function GanttLoadingSkeleton() {
    return (
        <div className="w-full h-full min-h-[400px] bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 rounded-xl border border-slate-200/60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 animate-ping">
                        <BarChart3 className="h-12 w-12 text-blue-400/60" />
                    </div>
                    <BarChart3 className="h-12 w-12 text-blue-600" />
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Loading Gantt Chart...</span>
                </div>
                <div className="flex gap-2 mt-2">
                    <div className="h-2 w-24 bg-slate-200 rounded-full animate-pulse"></div>
                    <div className="h-2 w-16 bg-slate-200 rounded-full animate-pulse delay-75"></div>
                    <div className="h-2 w-20 bg-slate-200 rounded-full animate-pulse delay-150"></div>
                </div>
            </div>
        </div>
    );
}

// Error fallback component
function GanttErrorFallback({ error }: { error?: Error }) {
    return (
        <div className="w-full h-full min-h-[400px] bg-gradient-to-br from-red-50 to-orange-50/30 rounded-xl border border-red-200/60 flex items-center justify-center">
            <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Gantt Chart</h3>
                <p className="text-sm text-red-600 max-w-md">
                    {error?.message || 'An unexpected error occurred while loading the Gantt chart component.'}
                </p>
            </div>
        </div>
    );
}

// Dynamically import the Gantt chart to avoid SSR issues
const DhtmlxGanttChart = dynamic(
    () => import('./DhtmlxGanttChart').then((mod) => mod.DhtmlxGanttChart),
    {
        ssr: false,
        loading: () => <GanttLoadingSkeleton />
    }
);

// Wrapper component with error boundary behavior
/**
 * GanttChartWrapper now supports an optional `exportMode` prop for PDF/static export.
 * It ensures the chart fills the available height, supports sticky task names, and smooth horizontal scroll.
 */
export function GanttChartWrapper(props: GanttChartProps & { exportMode?: boolean }) {
    return <DhtmlxGanttChart {...props} onTaskReorder={props.onTaskReorder} exportMode={props.exportMode} />;
}

export default GanttChartWrapper;
