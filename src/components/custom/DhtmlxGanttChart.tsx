"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { GanttTask, GanttLink, GanttChangeEvent, GanttChartProps } from '@/types/gantt';

// Styling constants matching the existing design system
const GANTT_STYLES = `
  .gantt_container {
    font-family: inherit;
    border-radius: 12px;
    border: 1px solid rgba(203, 213, 225, 0.6);
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  }
  
  .gantt_grid_scale, .gantt_task_scale {
    background: linear-gradient(to right, rgba(248, 250, 252, 1), rgba(239, 246, 255, 0.3), rgba(250, 245, 255, 0.2));
  }
  
  .gantt_scale_cell {
    color: #475569;
    font-weight: 600;
    font-size: 11px;
    border-right: 1px solid rgba(203, 213, 225, 0.4) !important;
  }
  
  .gantt_task_row {
    border-bottom: 1px solid rgba(241, 245, 249, 0.6);
  }
  
  .gantt_task_row:hover {
    background: linear-gradient(to right, rgba(239, 246, 255, 0.6), rgba(250, 245, 255, 0.3));
  }
  
  .gantt_row {
    border-bottom: 1px solid rgba(241, 245, 249, 0.6);
  }
  
  .gantt_row:hover {
    background: linear-gradient(to right, rgba(239, 246, 255, 0.6), rgba(250, 245, 255, 0.3));
  }
  
  .gantt_grid_head_cell {
    color: #334155;
    font-weight: 700;
    font-size: 12px;
    background: linear-gradient(to bottom, rgba(248, 250, 252, 1), rgba(241, 245, 249, 1));
  }
  
  .gantt_cell {
    color: #475569;
    font-size: 12px;
  }
  
  /* Task bar styling */
  .gantt_task_line {
    border-radius: 6px;
    border: 2px solid;
    box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.15);
  }
  
  .gantt_task_line.gantt_project {
    background: linear-gradient(to right, #8b5cf6, #d946ef, #f43f5e);
    border-color: #a78bfa;
  }
  
  .gantt_task_line.gantt_task {
    background: linear-gradient(to right, #3b82f6, #6366f1, #8b5cf6);
    border-color: #60a5fa;
  }
  
  .gantt_task_line.gantt_milestone {
    background: linear-gradient(to right, #10b981, #14b8a6);
    border-color: #34d399;
  }
  
  /* Progress bar */
  .gantt_task_progress {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
  
  .gantt_task_progress_wrapper {
    border-radius: 4px;
  }
  
  /* Task text */
  .gantt_task_content {
    color: white;
    font-weight: 600;
    font-size: 11px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  
  /* Grid columns */
  .gantt_grid_data .gantt_cell {
    padding: 0 8px;
  }
  
  /* Today marker */
  .gantt_marker {
    background: linear-gradient(to bottom, #ef4444, #f97316);
    width: 2px;
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
  }
  
  .gantt_marker_content {
    background: #ef4444;
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  /* Links styling */
  .gantt_task_link {
    opacity: 0.6;
  }
  
  .gantt_task_link:hover {
    opacity: 1;
  }
  
  /* Lightbox (edit modal) styling */
  .gantt_cal_light {
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(203, 213, 225, 0.6);
  }
  
  .gantt_cal_ltext textarea {
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
  }
  
  .gantt_btn_set {
    border-radius: 8px !important;
  }
  
  .gantt_save_btn {
    background: linear-gradient(to right, #3b82f6, #6366f1) !important;
    border-radius: 8px !important;
    color: white !important;
    font-weight: 600 !important;
  }
  
  .gantt_cancel_btn {
    background: #f1f5f9 !important;
    border-radius: 8px !important;
    color: #475569 !important;
    font-weight: 600 !important;
  }
  
  .gantt_delete_btn {
    background: linear-gradient(to right, #ef4444, #f97316) !important;
    border-radius: 8px !important;
    color: white !important;
    font-weight: 600 !important;
  }
  
  /* Progress drag handle */
  .gantt_task_progress_drag {
    cursor: ew-resize;
  }
  
  /* Resize handles */
  .gantt_task_drag {
    cursor: ew-resize;
  }
  
  /* Selected task */
  .gantt_selected .gantt_task_line {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4), 0 4px 12px -2px rgba(0, 0, 0, 0.2);
  }
  
  /* Weekend columns */
  .weekend {
    background: #f8fafc !important;
  }
`;

export function DhtmlxGanttChart({
  tasks,
  links = [],
  onTaskChange,
  onLinkChange,
  readOnly = false,
  height = '100%',
  zoom = 'month'
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ganttRef = useRef<any>(null);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);

  // Configure zoom level
  const configureZoom = useCallback((gantt: any, level: string) => {
    if (!gantt) return;

    switch (level) {
      case 'day':
        gantt.config.scale_unit = 'day';
        gantt.config.date_scale = '%d %M';
        gantt.config.subscales = [{ unit: 'hour', step: 4, date: '%H:%i' }];
        gantt.config.min_column_width = 40;
        break;
      case 'week':
        gantt.config.scale_unit = 'week';
        gantt.config.date_scale = 'Week #%W';
        gantt.config.subscales = [{ unit: 'day', step: 1, date: '%d' }];
        gantt.config.min_column_width = 30;
        break;
      case 'month':
        gantt.config.scale_unit = 'month';
        gantt.config.date_scale = '%F %Y';
        gantt.config.subscales = [{ unit: 'day', step: 1, date: '%d' }];
        gantt.config.min_column_width = 25;
        break;
      case 'year':
        gantt.config.scale_unit = 'year';
        gantt.config.date_scale = '%Y';
        gantt.config.subscales = [{ unit: 'month', step: 1, date: '%M' }];
        gantt.config.min_column_width = 60;
        break;
    }
  }, []);

  // Initialize Gantt - dynamically import to avoid SSR issues
  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    const initGantt = async () => {
      try {
        // Dynamically import gantt and its CSS
        const ganttModule = await import('dhtmlx-gantt');
        await import('dhtmlx-gantt/codebase/dhtmlxgantt.css');

        if (!isMounted || !containerRef.current) return;

        const gantt = ganttModule.gantt;
        ganttRef.current = gantt;

        // Inject custom styles
        const styleElement = document.createElement('style');
        styleElement.textContent = GANTT_STYLES;
        document.head.appendChild(styleElement);
        styleElementRef.current = styleElement;

        // Basic configuration
        gantt.config.date_format = '%Y-%m-%d';
        gantt.config.xml_date = '%Y-%m-%d';
        gantt.config.readonly = readOnly;

        // Enable features
        gantt.config.drag_resize = !readOnly;
        gantt.config.drag_move = !readOnly;
        gantt.config.drag_progress = !readOnly;
        gantt.config.drag_links = !readOnly;
        gantt.config.details_on_dblclick = !readOnly;
        gantt.config.details_on_create = !readOnly;

        // Auto-calculate parent progress
        gantt.config.auto_types = true;

        // Open all tasks by default
        gantt.config.open_tree_initially = true;

        // Configure zoom
        configureZoom(gantt, zoom);

        // Grid columns configuration
        gantt.config.columns = [
          { name: 'text', label: 'Activity', tree: true, width: 200, resize: true },
          { name: 'start_date', label: 'Start', align: 'center', width: 90 },
          { name: 'duration', label: 'Days', align: 'center', width: 50 },
          {
            name: 'progress',
            label: 'Progress',
            align: 'center',
            width: 70,
            template: (task: any) => `${Math.round((task.progress || 0) * 100)}%`
          },
          {
            name: 'add',
            label: '',
            width: 44,
            align: 'center'
          }
        ];

        // Lightbox configuration for editing
        gantt.config.lightbox.sections = [
          { name: 'description', height: 38, map_to: 'text', type: 'textarea', focus: true },
          { name: 'time', type: 'duration', map_to: 'auto' },
          {
            name: 'progress', height: 38, map_to: 'progress', type: 'select', options: [
              { key: 0, label: '0%' },
              { key: 0.1, label: '10%' },
              { key: 0.2, label: '20%' },
              { key: 0.3, label: '30%' },
              { key: 0.4, label: '40%' },
              { key: 0.5, label: '50%' },
              { key: 0.6, label: '60%' },
              { key: 0.7, label: '70%' },
              { key: 0.8, label: '80%' },
              { key: 0.9, label: '90%' },
              { key: 1, label: '100%' }
            ]
          }
        ];

        // Highlight weekends
        gantt.templates.scale_cell_class = (date: Date) => {
          if (date.getDay() === 0 || date.getDay() === 6) {
            return 'weekend';
          }
          return '';
        };

        gantt.templates.timeline_cell_class = (_task: any, date: Date) => {
          if (date.getDay() === 0 || date.getDay() === 6) {
            return 'weekend';
          }
          return '';
        };

        // Task class based on type
        gantt.templates.task_class = (_start: Date, _end: Date, task: any) => {
          const classes = [];
          if (task.type === 'project' || task.isMainActivity) {
            classes.push('gantt_project');
          } else if (task.type === 'milestone') {
            classes.push('gantt_milestone');
          }
          return classes.join(' ');
        };

        // Event handlers for change tracking
        gantt.attachEvent('onAfterTaskAdd', (id: string | number, task: any) => {
          if (onTaskChange) {
            onTaskChange({
              type: 'add',
              task: task as GanttTask,
              timestamp: new Date()
            });
          }
          return true;
        });

        gantt.attachEvent('onAfterTaskUpdate', (id: string | number, task: any) => {
          if (onTaskChange) {
            onTaskChange({
              type: 'update',
              task: task as GanttTask,
              timestamp: new Date()
            });
          }
          return true;
        });

        gantt.attachEvent('onAfterTaskDelete', (id: string | number) => {
          if (onTaskChange) {
            onTaskChange({
              type: 'delete',
              taskId: id,
              timestamp: new Date()
            });
          }
          return true;
        });

        gantt.attachEvent('onAfterLinkAdd', (id: string | number, link: any) => {
          if (onLinkChange) {
            onLinkChange({
              type: 'add',
              link: link as GanttLink,
              timestamp: new Date()
            });
          }
          return true;
        });

        gantt.attachEvent('onAfterLinkUpdate', (id: string | number, link: any) => {
          if (onLinkChange) {
            onLinkChange({
              type: 'update',
              link: link as GanttLink,
              timestamp: new Date()
            });
          }
          return true;
        });

        gantt.attachEvent('onAfterLinkDelete', (id: string | number) => {
          if (onLinkChange) {
            onLinkChange({
              type: 'delete',
              linkId: id,
              timestamp: new Date()
            });
          }
          return true;
        });

        // Initialize gantt
        gantt.init(containerRef.current);

        // Add today marker (optional - may not be available in all versions)
        try {
          if (typeof gantt.addMarker === 'function') {
            const today = new Date();
            gantt.addMarker({
              start_date: today,
              css: 'today_marker',
              text: 'Today',
              title: `Today: ${today.toLocaleDateString()}`
            });
          }
        } catch (markerError) {
          console.warn('Could not add today marker:', markerError);
        }


        // Load data
        if (tasks.length > 0) {
          gantt.parse({ data: tasks, links });
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize Gantt:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Gantt chart');
        setIsLoading(false);
      }
    };

    initGantt();

    // Cleanup
    return () => {
      isMounted = false;
      if (ganttRef.current) {
        try {
          ganttRef.current.clearAll();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (styleElementRef.current) {
        styleElementRef.current.remove();
      }
    };
  }, []);

  // Update data when tasks change
  useEffect(() => {
    const gantt = ganttRef.current;
    if (gantt && !isLoading && tasks.length > 0) {
      try {
        gantt.clearAll();
        gantt.parse({ data: tasks, links });
      } catch (e) {
        console.error('Error updating gantt data:', e);
      }
    }
  }, [tasks, links, isLoading]);

  // Update zoom level
  useEffect(() => {
    const gantt = ganttRef.current;
    if (gantt && !isLoading) {
      configureZoom(gantt, zoom);
      try {
        gantt.render();
      } catch (e) {
        console.error('Error re-rendering gantt:', e);
      }
    }
  }, [zoom, isLoading, configureZoom]);

  // Update readonly mode
  useEffect(() => {
    const gantt = ganttRef.current;
    if (gantt && !isLoading) {
      gantt.config.readonly = readOnly;
      gantt.config.drag_resize = !readOnly;
      gantt.config.drag_move = !readOnly;
      gantt.config.drag_progress = !readOnly;
      gantt.config.drag_links = !readOnly;
      try {
        gantt.render();
      } catch (e) {
        console.error('Error re-rendering gantt:', e);
      }
    }
  }, [readOnly, isLoading]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-lg border border-red-200 p-8">
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load Gantt Chart</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-600 font-medium">Loading Gantt Chart...</span>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
        className="gantt-container"
      />
    </div>
  );
}

export default DhtmlxGanttChart;
