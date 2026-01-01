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
    onTaskReorder?: (tasks: GanttTask[]) => void;
    readOnly?: boolean;
    height?: string;
    zoom?: 'day' | 'week' | 'month' | 'year' | 'quarter_day' | 'alternate_day';
}

/**
 * Default schedule template based on provided data
 */
const DEFAULT_SCHEDULE_TEMPLATE = [
    // A. Land Allotment and Layout
    { id: 'a', text: 'Land Allotment and Layout', startDate: '2025-11-03', endDate: '2025-11-30', progress: 1.0, isMain: true },
    { id: 'a1', text: 'Land Alotment', startDate: '2025-11-03', endDate: '2025-11-03', progress: 1.0, parent: 'a' },
    { id: 'a2', text: 'Land Demarcation', startDate: '2025-11-11', endDate: '2025-11-11', progress: 1.0, parent: 'a' },
    { id: 'a3', text: 'Contouring & Layout', startDate: '2025-11-11', endDate: '2025-11-30', progress: 1.0, parent: 'a' },

    // B. Control Room Building
    { id: 'b', text: 'Control Room Building', startDate: '2025-12-01', endDate: '2026-02-24', progress: 0.12, isMain: true },
    { id: 'b1', text: 'Excavation/PCC in foundation', startDate: '2025-12-01', endDate: '2025-12-04', progress: 1.0, parent: 'b' },
    { id: 'b2', text: 'Column Reinforcement', startDate: '2025-12-05', endDate: '2025-12-10', progress: 1.0, parent: 'b' },
    { id: 'b3', text: 'Footing Concrete', startDate: '2025-12-15', endDate: '2025-12-23', progress: 1.0, parent: 'b' },
    { id: 'b4', text: 'brick work below Plinth and trench', startDate: '2025-12-23', endDate: '2025-12-29', progress: 1.0, parent: 'b' },
    { id: 'b5', text: 'Rcc in plinth beam', startDate: '2025-12-30', endDate: '2026-01-03', progress: 0.2, parent: 'b' },
    { id: 'b6', text: 'Coloumn work up to lintel bend', startDate: '2026-01-05', endDate: '2026-01-09', progress: 0, parent: 'b' },
    { id: 'b7', text: 'Brick work up to lintel bend', startDate: '2026-01-07', endDate: '2026-01-10', progress: 0, parent: 'b' },
    { id: 'b8', text: 'Lintel and Sunshade', startDate: '2026-01-10', endDate: '2026-01-12', progress: 0, parent: 'b' },
    { id: 'b9', text: 'Coloumn work up to roof slab', startDate: '2026-01-10', endDate: '2026-01-14', progress: 0, parent: 'b' },
    { id: 'b10', text: 'Brick work up to roof slab', startDate: '2026-01-10', endDate: '2026-01-16', progress: 0, parent: 'b' },
    { id: 'b11', text: 'Slab Shuttering and Deshuttering', startDate: '2026-01-18', endDate: '2026-02-12', progress: 0, parent: 'b' },
    { id: 'b12', text: 'Plaster work', startDate: '2026-02-13', endDate: '2026-02-18', progress: 0, parent: 'b' },
    { id: 'b13', text: 'Flooring/Tiling work', startDate: '2026-02-15', endDate: '2026-02-19', progress: 0, parent: 'b' },
    { id: 'b14', text: 'Plumbing/Electrification work', startDate: '2026-02-13', endDate: '2026-02-18', progress: 0, parent: 'b' },
    { id: 'b15', text: 'Painting work', startDate: '2026-02-20', endDate: '2026-02-24', progress: 0, parent: 'b' },

    // C. Boundry Wall
    { id: 'c', text: 'Boundry Wall', startDate: '2025-12-01', endDate: '2026-02-24', progress: 0, isMain: true },
    { id: 'c1', text: 'Excavation in foundation', startDate: '2025-12-01', endDate: '2025-12-06', progress: 1.0, parent: 'c' },
    { id: 'c2', text: 'Column Reinforcement', startDate: '2025-12-25', endDate: '2025-12-31', progress: 0.8, parent: 'c' },
    { id: 'c3', text: 'Footing PCC and Concrete', startDate: '2025-12-28', endDate: '2026-01-09', progress: 0.15, parent: 'c' },
    { id: 'c4', text: 'brick work below PB', startDate: '2026-01-06', endDate: '2026-01-12', progress: 0, parent: 'c' },
    { id: 'c5', text: 'Rcc in plinth beam', startDate: '2026-01-12', endDate: '2026-01-16', progress: 0, parent: 'c' },
    { id: 'c6', text: 'Column Concreting', startDate: '2026-01-16', endDate: '2026-01-26', progress: 0, parent: 'c' },
    { id: 'c7', text: 'Brick Work', startDate: '2026-01-18', endDate: '2026-01-30', progress: 0, parent: 'c' },
    { id: 'c8', text: 'Top Beam', startDate: '2026-01-28', endDate: '2026-02-01', progress: 0, parent: 'c' },
    { id: 'c9', text: 'Plaster work', startDate: '2026-01-25', endDate: '2026-02-05', progress: 0, parent: 'c' },
    { id: 'c10', text: 'Fininshing Work', startDate: '2026-02-02', endDate: '2026-02-20', progress: 0, parent: 'c' },

    // D. Earth Filling
    { id: 'd', text: 'Earth Filling', startDate: '2026-01-02', endDate: '2026-01-15', progress: 0.1, isMain: true },

    // E. Road and Yard Work
    { id: 'e', text: 'Road and Yard Work', startDate: '2026-01-20', endDate: '2026-02-24', progress: 0, isMain: true },
    { id: 'e1', text: 'Road Sub Base /Toe Wall', startDate: '2026-01-28', endDate: '2026-02-03', progress: 0, parent: 'e' },
    { id: 'e2', text: 'Road GSB Work', startDate: '2026-02-05', endDate: '2026-02-10', progress: 0, parent: 'e' },
    { id: 'e3', text: 'Road Work', startDate: '2026-02-13', endDate: '2026-02-16', progress: 0, parent: 'e' },

    // F. Other Yard Related Works
    { id: 'f', text: 'Other Yard Related Works', startDate: '2026-02-01', endDate: '2026-02-24', progress: 0, isMain: true },
];

/**
 * Transform work data to Gantt task format with fixed default schedule
 */
export function workToGanttTasks(work: any): GanttTask[] {
    const tasks: GanttTask[] = [];

    DEFAULT_SCHEDULE_TEMPLATE.forEach(template => {
        tasks.push({
            id: template.id,
            text: template.text,
            start_date: template.startDate,
            end_date: template.endDate,
            progress: template.progress,
            open: true,
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
