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
    zoom?: 'day' | 'week' | 'month' | 'year' | 'quarter_day' | 'alternate_day';
}

/**
 * Default schedule template for civil works
 * Days are relative to start date (day 0)
 */
const DEFAULT_SCHEDULE_TEMPLATE = [
    // A. Land Allotment and Layout (Days 0-27)
    { id: 'a', text: 'Land Allotment and Layout', startDay: 0, endDay: 27, isMain: true },
    { id: 'a1', text: 'Land Allotment', startDay: 0, endDay: 0, isMain: false, parent: 'a' },
    { id: 'a2', text: 'Land Demarcation', startDay: 8, endDay: 8, isMain: false, parent: 'a' },
    { id: 'a3', text: 'Contouring & Layout', startDay: 8, endDay: 27, isMain: false, parent: 'a' },

    // B. Control Room Building (Days 28-90)
    { id: 'b', text: 'Control Room Building', startDay: 28, endDay: 90, isMain: true },
    { id: 'b1', text: 'Excavation/PCC in foundation', startDay: 28, endDay: 31, isMain: false, parent: 'b' },
    { id: 'b2', text: 'Column Reinforcement', startDay: 32, endDay: 37, isMain: false, parent: 'b' },
    { id: 'b3', text: 'Footing Concrete', startDay: 42, endDay: 50, isMain: false, parent: 'b' },
    { id: 'b4', text: 'Plinth Beam Work', startDay: 51, endDay: 60, isMain: false, parent: 'b' },
    { id: 'b5', text: 'Brick Masonry', startDay: 61, endDay: 75, isMain: false, parent: 'b' },
    { id: 'b6', text: 'Roof Slab Casting', startDay: 76, endDay: 85, isMain: false, parent: 'b' },
    { id: 'b7', text: 'Plastering & Finishing', startDay: 86, endDay: 90, isMain: false, parent: 'b' },

    // C. Equipment Foundation (Days 45-80)
    { id: 'c', text: 'Equipment Foundation', startDay: 45, endDay: 80, isMain: true },
    { id: 'c1', text: 'Transformer Foundation', startDay: 45, endDay: 55, isMain: false, parent: 'c' },
    { id: 'c2', text: 'Breaker Foundation', startDay: 50, endDay: 60, isMain: false, parent: 'c' },
    { id: 'c3', text: 'CT/PT Foundation', startDay: 55, endDay: 65, isMain: false, parent: 'c' },
    { id: 'c4', text: 'LA/Isolator Foundation', startDay: 60, endDay: 70, isMain: false, parent: 'c' },
    { id: 'c5', text: 'Cable Trench Work', startDay: 65, endDay: 80, isMain: false, parent: 'c' },

    // D. Electrical Work (Days 70-120)
    { id: 'd', text: 'Electrical Work', startDay: 70, endDay: 120, isMain: true },
    { id: 'd1', text: 'Earthing Work', startDay: 70, endDay: 80, isMain: false, parent: 'd' },
    { id: 'd2', text: 'Cable Laying', startDay: 81, endDay: 95, isMain: false, parent: 'd' },
    { id: 'd3', text: 'Equipment Erection', startDay: 90, endDay: 110, isMain: false, parent: 'd' },
    { id: 'd4', text: 'Termination & Testing', startDay: 111, endDay: 120, isMain: false, parent: 'd' },

    // E. Miscellaneous (Days 100-130)
    { id: 'e', text: 'Miscellaneous & Finishing', startDay: 100, endDay: 130, isMain: true },
    { id: 'e1', text: 'Boundary Wall', startDay: 100, endDay: 115, isMain: false, parent: 'e' },
    { id: 'e2', text: 'Gate & Fencing', startDay: 110, endDay: 120, isMain: false, parent: 'e' },
    { id: 'e3', text: 'Road & Drain Work', startDay: 115, endDay: 125, isMain: false, parent: 'e' },
    { id: 'e4', text: 'Final Inspection & Handover', startDay: 126, endDay: 130, isMain: false, parent: 'e' },
];

/**
 * Add days to a date string and return new date string
 */
function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

/**
 * Transform work data to Gantt task format with detailed default schedule
 */
export function workToGanttTasks(work: any): GanttTask[] {
    const tasks: GanttTask[] = [];

    // Get work start date or default to today
    const startDate = work.start_date || new Date().toISOString().split('T')[0];

    // Generate tasks from template
    DEFAULT_SCHEDULE_TEMPLATE.forEach(template => {
        const taskStartDate = addDays(startDate, template.startDay);
        const taskEndDate = addDays(startDate, template.endDay);

        tasks.push({
            id: template.id,
            text: template.text,
            start_date: taskStartDate,
            end_date: taskEndDate,
            progress: calculateProgress(taskStartDate, taskEndDate),
            open: false,
            type: template.isMain ? 'project' : 'task',
            parent: template.parent,
            isMainActivity: template.isMain
        });
    });

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
