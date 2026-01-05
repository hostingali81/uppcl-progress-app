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
    font-size: 10px;
    border-right: 1px solid rgba(203, 213, 225, 0.4) !important;
  }
  
  .gantt_task_row {
    border-bottom: 1px solid rgba(241, 245, 249, 0.6);
    min-height: 40px;
  }
  
  .gantt_task_row:hover {
    background: linear-gradient(to right, rgba(239, 246, 255, 0.6), rgba(250, 245, 255, 0.3));
  }
  
  .gantt_row {
    border-bottom: 1px solid rgba(241, 245, 249, 0.6);
    min-height: 40px;
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
    min-height: 28px;
  }
  
  .gantt_task_line.gantt_project {
    background: linear-gradient(to right, #f59e0b, #f97316);
    border-color: #fb923c;
  }
  
  .gantt_task_line.gantt_task {
    background: linear-gradient(to right, #3b82f6, #2563eb);
    border-color: #60a5fa;
  }
  
  .gantt_task_line.gantt_milestone {
    background: linear-gradient(to right, #10b981, #14b8a6);
    border-color: #34d399;
  }
  
  /* Progress bar */
  .gantt_task_progress {
    background: linear-gradient(to right, #10b981, #059669);
    border-radius: 4px;
    opacity: 0.9;
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
  
  /* Mobile-specific styles */
  @media (max-width: 768px) {
    .gantt_task_row,
    .gantt_row {
      min-height: 44px;
    }
    
    .gantt_task_line {
      min-height: 32px;
    }
    
    .gantt_cell {
      font-size: 11px !important;
      padding: 0 4px !important;
    }
    
    .gantt_grid_head_cell {
      font-size: 11px !important;
      padding: 0 4px !important;
    }
    
    .gantt_scale_cell {
      font-size: 10px !important;
      padding: 2px !important;
    }
    
    .gantt_task_content {
      font-size: 11px !important;
    }
    
    /* Reduce grid column widths for mobile */
    .gantt_grid {
      min-width: 280px !important;
    }
    
    .gantt_grid_data .gantt_cell {
      padding: 0 4px !important;
    }
  }
  
  /* Ensure horizontal scrollability */
  .gantt_layout_cell {
    overflow-x: auto !important;
  }
  
  .gantt_task {
    overflow-x: auto !important;
  }
`;

/**
 * DhtmlxGanttChart now supports an `exportMode` prop for PDF/static export.
 * It ensures the chart fills the available height, supports sticky task names, and smooth horizontal scroll.
 */
export function DhtmlxGanttChart({
  tasks,
  links = [],
  onTaskChange,
  onLinkChange,
  onTaskReorder,
  readOnly = false,
  height = '100%',
  zoom = 'month',
  exportMode = false
}: GanttChartProps & { exportMode?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ganttRef = useRef<any>(null);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  const openTasksRef = useRef<Set<string | number>>(new Set());
  const isZoomChangeRef = useRef(false);
  const prevDataRef = useRef<string>('');

  // Keep track of readOnly state for event handlers
  const readOnlyRef = useRef(readOnly);
  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);

  // Configure zoom level with auto-fit
  const configureZoom = useCallback((gantt: any, level: string, tasks: GanttTask[]) => {
    if (!gantt || !containerRef.current) return;

    // Clear previous config
    gantt.config.subscales = [];
    gantt.config.step = 1;
    gantt.config.scale_height = 50;

    // Calculate date range from tasks
    let minDate = new Date();
    let maxDate = new Date();

    if (tasks.length > 0) {
      const dates = tasks.map(t => new Date(t.start_date));
      const endDates = tasks.filter(t => t.end_date).map(t => new Date(t.end_date!));
      minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      maxDate = new Date(Math.max(...endDates.map(d => d.getTime())));
    }

    // Get available width (subtract grid width ~450px)
    const availableWidth = containerRef.current.offsetWidth - 450;
    const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (level) {
      case 'day':
        gantt.config.scale_unit = 'day';
        gantt.config.date_scale = '%d %M';
        gantt.config.min_column_width = Math.max(30, Math.floor(availableWidth / daysDiff));
        break;
      case 'alternate_day':
        gantt.config.scale_unit = 'day';
        gantt.config.step = 2;
        gantt.config.date_scale = '%d %M';
        gantt.config.min_column_width = Math.max(30, Math.floor(availableWidth / (daysDiff / 2)));
        break;
      case 'week':
        const weeks = Math.ceil(daysDiff / 7);
        gantt.config.scale_unit = 'week';
        gantt.config.date_scale = 'W%W';
        gantt.config.min_column_width = Math.max(40, Math.floor(availableWidth / weeks));
        break;
      case 'month':
        const months = Math.ceil(daysDiff / 30);
        gantt.config.scale_unit = 'month';
        gantt.config.date_scale = '%M %y';
        gantt.config.min_column_width = Math.max(50, Math.floor(availableWidth / months));
        break;
      case 'year':
        const years = Math.ceil(daysDiff / 365);
        gantt.config.scale_unit = 'year';
        gantt.config.date_scale = '%Y';
        gantt.config.subscales = [{ unit: 'month', step: 1, date: '%M' }];
        gantt.config.min_column_width = Math.max(60, Math.floor(availableWidth / years));
        gantt.config.scale_height = 60;
        break;
    }

    // Set date range to fit exactly
    gantt.config.start_date = minDate;
    gantt.config.end_date = maxDate;
  }, []);

  // Initialize Gantt - dynamically import to avoid SSR issues
  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    // If exportMode, disable all animations and scrolling
    if (exportMode) {
      document.body.classList.add('gantt-export-mode');
    } else {
      document.body.classList.remove('gantt-export-mode');
    }

    const initGantt = async () => {
      try {
        // Dynamically import gantt and its CSS
        const ganttModule = await import('dhtmlx-gantt');
        await import('dhtmlx-gantt/codebase/dhtmlxgantt.css');

        if (!isMounted || !containerRef.current) return;

        const gantt = ganttModule.gantt;
        ganttRef.current = gantt;

        // Expose gantt instance globally for PDF export
        if (typeof window !== 'undefined') {
          (window as any).gantt = gantt;
        }

        // Inject custom styles
        const styleElement = document.createElement('style');
        styleElement.textContent = GANTT_STYLES;
        document.head.appendChild(styleElement);
        styleElementRef.current = styleElement;

        // Basic configuration
        gantt.config.date_format = '%Y-%m-%d';
        gantt.config.xml_date = '%Y-%m-%d';
        gantt.config.readonly = readOnly;

        // Enable features - allow all drag operations for UI flexibility
        gantt.config.drag_resize = !readOnly; // Allow date resize
        gantt.config.drag_move = !readOnly; // Allow date move
        gantt.config.drag_progress = !readOnly; // Allow progress drag
        gantt.config.drag_links = !readOnly;
        gantt.config.details_on_dblclick = !readOnly;
        gantt.config.details_on_create = !readOnly;
        gantt.config.grid_resize = true; // Enable column resizing
        gantt.config.order_branch = true; // Enable vertical reordering
        gantt.config.order_branch_free = false; // Restrict to same level

        // Mobile layout: stack grid above timeline
        const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
        if (isMobileView) {
          gantt.config.layout = {
            css: "gantt_container",
            rows: [
              {
                cols: [
                  { view: "grid", scrollX: "scrollHor", scrollY: "scrollVer" },
                ]
              },
              { resizer: true, width: 1 },
              {
                cols: [
                  { view: "timeline", scrollX: "scrollHor", scrollY: "scrollVer" },
                  { view: "scrollbar", id: "scrollVer" }
                ]
              },
              { view: "scrollbar", id: "scrollHor" }
            ]
          };
        }

        // Auto-calculate parent progress
        gantt.config.auto_types = true;

        // Open all tasks by default
        gantt.config.open_tree_initially = false;

        // Track task open/close state
        gantt.attachEvent('onTaskOpened', (id: string | number) => {
          openTasksRef.current.add(id);
          return true;
        });

        gantt.attachEvent('onTaskClosed', (id: string | number) => {
          openTasksRef.current.delete(id);
          return true;
        });


        // CRITICAL: Auto-size to fill vertical space
        gantt.config.autosize = 'y';
        gantt.config.row_height = 44;
        gantt.config.bar_height = 28;
        // For export, disable animations and scroll, and ensure all is visible
        if (exportMode) {
          gantt.config.static_background = true;
          gantt.config.scroll_on_click = false;
          gantt.config.show_grid = true;
          gantt.config.show_chart = true;
          gantt.config.autosize = 'xy';
          gantt.config.readonly = true;
        }

        // Configure zoom
        configureZoom(gantt, zoom, tasks);

        // Grid columns configuration with resizable columns
        gantt.config.columns = isMobileView ? [
          { name: 'text', label: 'Activity', tree: true, width: 140, resize: true, min_width: 100, template: (task: any) => `<div class='gantt-sticky-task'>${task.text}</div>` },
          { name: 'start_date', label: 'Start', align: 'center', width: 70, resize: true, min_width: 60 },
          { name: 'duration', label: 'Days', align: 'center', width: 45, resize: true, min_width: 40 },
          {
            name: 'progress',
            label: '%',
            align: 'center',
            width: 45,
            resize: true,
            min_width: 40,
            template: (task: any) => {
              let progress = task.progress || 0;
              // Normalize: if > 1, it's already percentage
              if (progress > 1) {
                progress = progress / 100;
              }
              return `${Math.round(progress * 100)}%`;
            }
          }
        ] : [
          { name: 'text', label: 'Activity', tree: true, width: 220, resize: true, min_width: 100, template: (task: any) => `<div class='gantt-sticky-task'>${task.text}</div>` },
          { name: 'start_date', label: 'Start', align: 'center', width: 95, resize: true, min_width: 70 },
          { name: 'duration', label: 'Days', align: 'center', width: 60, resize: true, min_width: 40 },
          {
            name: 'progress',
            label: 'Progress',
            align: 'center',
            width: 75,
            resize: true,
            min_width: 50,
            template: (task: any) => {
              let progress = task.progress || 0;
              // Normalize: if > 1, it's already percentage
              if (progress > 1) {
                progress = progress / 100;
              }
              return `${Math.round(progress * 100)}%`;
            }
          },
          {
            name: 'add',
            label: '',
            width: 44,
            min_width: 44,
            align: 'center'
          }
        ];

        // Lightbox configuration for editing
        gantt.config.lightbox.sections = [
          { name: 'description', height: 38, map_to: 'text', type: 'textarea', focus: true },
          { name: 'time', type: 'duration', map_to: 'auto' },
          { name: 'progress', height: 38, map_to: 'progress', type: 'textarea' }
        ];

        // Custom template for progress input to show percentage
        gantt.locale.labels.section_description = 'Activity Name';
        gantt.locale.labels.section_time = 'Duration';
        gantt.locale.labels.section_progress = 'Progress (%)';

        // Attach event to convert progress for display
        gantt.attachEvent('onBeforeLightbox', (id: string | number) => {
          const task = gantt.getTask(id);
          // Ensure progress is in 0-1 range, then convert to 0-100 for display
          let progress = task.progress || 0;
          // If progress is already > 1, it's likely in percentage format, normalize it
          if (progress > 1) {
            progress = progress / 100;
          }
          task.progress = Math.round(progress * 100);
          return true;
        });

        gantt.attachEvent('onLightboxSave', (id: string | number, task: any) => {
          // Convert progress input (0-100) back to 0-1
          const progressValue = parseFloat(task.progress);
          if (!isNaN(progressValue)) {
            let normalized = progressValue;
            if (normalized > 1) {
              normalized = normalized / 100;
            }
            task.progress = Math.max(0, Math.min(1, normalized));
          } else {
            task.progress = 0;
          }
          return true;
        });

        // Enable keyboard delete support
        gantt.keys.edit_save = 13; // Enter to save
        gantt.keys.edit_cancel = 27; // Esc to cancel

        // Allow delete without native confirmation (it was causing issues)
        gantt.attachEvent('onBeforeTaskDelete', (id: string | number, task: any) => {
          console.log('onBeforeTaskDelete triggered', id, task);
          if (!readOnlyRef.current) {
            return true;
          }
          return false;
        });

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
          // Normalize progress to 0-1 range
          if (task.progress > 1) {
            task.progress = task.progress / 100;
          }
          if (onTaskChange) {
            onTaskChange({
              type: 'update',
              task: task as GanttTask,
              timestamp: new Date()
            });
          }
          return true;
        });

        // Track row reordering
        gantt.attachEvent('onRowDragEnd', (id: string | number, target: string | number) => {
          if (onTaskChange) {
            const task = gantt.getTask(id);
            onTaskChange({
              type: 'update',
              task: task as GanttTask,
              timestamp: new Date()
            });
          }

          // Handle reordering - get all tasks in new order
          if (onTaskReorder) {
            // Use eachTask to iterate in display order (hierarchy-aware)
            const reorderedTasks: GanttTask[] = [];
            gantt.eachTask((t: any) => {
              // Create a clean copy of the task
              const cleanTask: GanttTask = {
                id: t.id,
                text: t.text,
                start_date: t.start_date,
                end_date: t.end_date,
                duration: t.duration,
                progress: t.progress,
                parent: t.parent,
                open: t.open,
                type: t.type,
                isMainActivity: t.isMainActivity
              };

              // Normalize dates to strings if they are Date objects
              if ((cleanTask.start_date as any) instanceof Date) {
                const d = cleanTask.start_date as unknown as Date;
                cleanTask.start_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              }
              if ((cleanTask.end_date as any) instanceof Date) {
                const d = cleanTask.end_date as unknown as Date;
                cleanTask.end_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              }

              reorderedTasks.push(cleanTask);
            });

            console.log('Task Reordered. New count:', reorderedTasks.length);
            onTaskReorder(reorderedTasks);
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
          // Normalize progress values before loading
          const normalizedTasks = tasks.map(task => ({
            ...task,
            progress: task.progress > 1 ? task.progress / 100 : task.progress
          }));
          gantt.parse({ data: normalizedTasks, links });

          // Force render to ensure fresh data
          gantt.render();

          // Restore open state for previously opened tasks
          openTasksRef.current.forEach((taskId) => {
            if (gantt.isTaskExists(taskId)) {
              gantt.open(taskId);
            }
          });


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
      // Clean up global reference
      if (typeof window !== 'undefined' && (window as any).gantt === ganttRef.current) {
        delete (window as any).gantt;
      }
    };
  }, []);

  // Update data when tasks change
  useEffect(() => {
    const gantt = ganttRef.current;
    if (gantt && !isLoading) {
      // Create stable comparison key using sorted IDs and key properties
      const createDataKey = (tasks: GanttTask[]) => {
        return tasks.map(t => `${t.id}:${t.text}:${t.start_date}:${t.end_date}:${t.progress}`).sort().join('|');
      };
      
      const currentDataKey = createDataKey(tasks);
      if (prevDataRef.current === currentDataKey && !isZoomChangeRef.current) {
        return;
      }
      prevDataRef.current = currentDataKey;

      try {
        // Clear all data and cache completely
        gantt.clearAll();
        
        if (tasks.length > 0) {
          // Normalize progress values before loading
          const normalizedTasks = tasks.map(task => ({
            ...task,
            progress: task.progress > 1 ? task.progress / 100 : task.progress
          }));
          
          // Parse fresh data
          gantt.parse({ data: normalizedTasks, links });

          // Force complete re-render
          gantt.render();

          // Restore open state if not a zoom change
          if (!isZoomChangeRef.current) {
            openTasksRef.current.forEach((taskId) => {
              if (gantt.isTaskExists(taskId)) {
                gantt.open(taskId);
              }
            });
          }
        }

        isZoomChangeRef.current = false;
      } catch (e) {
        console.error('Error updating gantt data:', e);
      }
    }
  }, [tasks, links, isLoading]);

  // Update zoom level
  useEffect(() => {
    const gantt = ganttRef.current;
    if (gantt && !isLoading && containerRef.current) {
      try {
        isZoomChangeRef.current = true;
        configureZoom(gantt, zoom, tasks);
        gantt.render();



        // Reset flag after a short delay
        setTimeout(() => {
          isZoomChangeRef.current = false;
        }, 100);
      } catch (e) {
        console.error('Error changing zoom:', e);
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
    <div className={`relative w-full h-full ${exportMode ? 'gantt-export-root' : ''}`} style={{ height }}>
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
        style={{ width: '100%', height: '100%', overflowX: exportMode ? 'visible' : 'auto', overflowY: 'auto' }}
        className="gantt-container"
      />
    </div>
  );
}

export default DhtmlxGanttChart;
