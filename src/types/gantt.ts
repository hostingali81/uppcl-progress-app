// TypeScript type definitions for dhtmlx-gantt integration

/**
 * Gantt task structure compatible with dhtmlx-gantt
 */
export interface GanttTask {
    id: string | number;
    text: string;
    start_date: string; // Format: "YYYY-MM-DD" or "DD-MM-YYYY HH:mm"
    end_date?: string;
    duration?: number; // Days
    progress: number; // 0 to 1
    parent?: string | number; // Parent task ID for hierarchy
    open?: boolean; // Whether children are expanded
    type?: 'task' | 'project' | 'milestone';
    readonly?: boolean;

    // Custom fields for our app
    isMainActivity?: boolean;
}

/**
 * Gantt link for task dependencies (future feature)
 */
export interface GanttLink {
    id: string | number;
    source: string | number;
    target: string | number;
    type: '0' | '1' | '2' | '3'; // 0: finish-to-start, 1: start-to-start, 2: finish-to-finish, 3: start-to-finish
}

/**
 * Data structure for dhtmlx-gantt initialization
 */
export interface GanttData {
    data: GanttTask[];
    links?: GanttLink[];
}

/**
 * Event types for change tracking
 */
export type GanttEventType = 'add' | 'update' | 'delete';

/**
 * Change event structure for tracking modifications
 */
export interface GanttChangeEvent {
    type: GanttEventType;
    task?: GanttTask;
    link?: GanttLink;
    taskId?: string | number;
    linkId?: string | number;
    timestamp: Date;
}

/**
 * Props for the Gantt chart component
 */
export interface GanttChartProps {
    tasks: GanttTask[];
    links?: GanttLink[];
    onTaskChange?: (event: GanttChangeEvent) => void;
    onLinkChange?: (event: GanttChangeEvent) => void;
    readOnly?: boolean;
    height?: string;
    zoom?: 'day' | 'week' | 'month' | 'year';
}

/**
 * Transform work data to Gantt task format
 */
export function workToGanttTasks(work: any): GanttTask[] {
    const tasks: GanttTask[] = [];

    // Main project task
    if (work.work_name) {
        const startDate = work.start_date || new Date().toISOString().split('T')[0];
        const endDate = work.expected_completion_date ||
            work.scheduled_completion_date ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        tasks.push({
            id: 'main',
            text: work.work_name,
            start_date: startDate,
            end_date: endDate,
            progress: (work.progress_percentage || 0) / 100,
            open: true,
            type: 'project',
            isMainActivity: true
        });

        // Sub-activities based on work dates
        let subIndex = 1;

        if (work.start_date) {
            tasks.push({
                id: `sub-${subIndex}`,
                text: 'Project Initiation',
                start_date: work.start_date,
                duration: 1,
                progress: 1,
                parent: 'main',
                isMainActivity: false
            });
            subIndex++;
        }

        if (work.scheduled_completion_date) {
            tasks.push({
                id: `sub-${subIndex}`,
                text: 'Scheduled Completion Phase',
                start_date: work.start_date || startDate,
                end_date: work.scheduled_completion_date,
                progress: calculateProgress(work.start_date, work.scheduled_completion_date),
                parent: 'main',
                isMainActivity: false
            });
            subIndex++;
        }

        if (work.expected_completion_date && work.expected_completion_date !== work.scheduled_completion_date) {
            tasks.push({
                id: `sub-${subIndex}`,
                text: 'Extended Completion Phase',
                start_date: work.scheduled_completion_date || work.start_date || startDate,
                end_date: work.expected_completion_date,
                progress: calculateProgress(work.scheduled_completion_date || work.start_date, work.expected_completion_date),
                parent: 'main',
                isMainActivity: false
            });
            subIndex++;
        }

        if (work.actual_completion_date) {
            tasks.push({
                id: `sub-${subIndex}`,
                text: 'Actual Completion',
                start_date: work.actual_completion_date,
                duration: 1,
                progress: 1,
                parent: 'main',
                type: 'milestone',
                isMainActivity: false
            });
        }
    }

    return tasks;
}

/**
 * Calculate progress based on current date vs date range
 */
function calculateProgress(startDate: string | null, endDate: string | null): number {
    if (!startDate || !endDate) return 0;

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return 0;
    if (now > end) return 1;

    const total = end.getTime() - start.getTime();
    if (total <= 0) return 0;

    const elapsed = now.getTime() - start.getTime();
    return Math.min(1, Math.max(0, elapsed / total));
}
