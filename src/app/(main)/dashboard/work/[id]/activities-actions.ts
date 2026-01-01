// @ts-nocheck
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { WorkActivity } from '@/lib/types';

/**
 * Get all activities for a work with their current progress
 */
export async function getWorkActivities(workId: number) {
    try {
        console.log('[getWorkActivities] Fetching activities for workId:', workId);
        const { admin } = await createSupabaseServerClient();
        
        const { data, error } = await admin
            .from('work_activities')
            .select('*')
            .eq('work_id', workId)
            .order('display_order', { ascending: true });
        
        console.log('[getWorkActivities] Query result - data:', data?.length, 'error:', error);
        
        if (error) throw error;
        
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Failed to get activities:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Update activity progress - automatically updates parent progress
 */
export async function updateActivityProgress(
    activityId: number,
    progress: number,
    workId: number
) {
    try {
        const { admin } = await createSupabaseServerClient();
        
        const { error } = await admin
            .from('work_activities')
            .update({ 
                progress_percentage: progress,
                updated_at: new Date().toISOString()
            })
            .eq('id', activityId);
        
        if (error) throw error;
        
        // Sync schedule_data with updated progress
        await syncScheduleWithActivities(workId);
        
        revalidatePath(`/dashboard/work/${workId}`);
        revalidatePath(`/dashboard/work/${workId}/schedule`);
        
        return { success: true };
    } catch (error) {
        console.error('Failed to update activity progress:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Sync schedule_data JSON with activities table
 */
export async function syncScheduleWithActivities(workId: number) {
    try {
        const { admin } = await createSupabaseServerClient();
        
        // Get current activities
        const { data: activities } = await admin
            .from('work_activities')
            .select('*')
            .eq('work_id', workId)
            .order('display_order', { ascending: true });
        
        if (!activities || activities.length === 0) return { success: true };
        
        // Get current schedule_data
        const { data: work } = await admin
            .from('works')
            .select('schedule_data')
            .eq('id', workId)
            .single();
        
        if (!work?.schedule_data) return { success: true };
        
        // Parse schedule data
        const scheduleData = JSON.parse(work.schedule_data);
        
        // Handle both old and new format
        let tasksToUpdate = [];
        if (scheduleData.customTasks && Array.isArray(scheduleData.customTasks)) {
            tasksToUpdate = scheduleData.customTasks;
        } else if (scheduleData.data && Array.isArray(scheduleData.data)) {
            tasksToUpdate = scheduleData.data;
        }
        
        // Update progress AND dates in schedule data from activities table
        const updatedTasks = tasksToUpdate.map((task: any) => {
            const activity = activities.find(a => a.activity_code === String(task.id));
            if (activity) {
                return {
                    ...task,
                    start_date: activity.start_date || task.start_date,
                    end_date: activity.end_date || task.end_date,
                    duration: activity.duration || task.duration,
                    progress: activity.progress_percentage / 100
                };
            }
            return task;
        });
        
        // Save updated schedule in new format
        const { error } = await admin
            .from('works')
            .update({ 
                schedule_data: JSON.stringify({ 
                    customTasks: updatedTasks,
                    deletedTaskIds: scheduleData.deletedTaskIds || []
                })
            })
            .eq('id', workId);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('Failed to sync schedule:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Initialize activities from schedule_data
 */
export async function initializeActivitiesFromSchedule(workId: number) {
    try {
        console.log('[initializeActivitiesFromSchedule] Starting for workId:', workId);
        const { admin } = await createSupabaseServerClient();
        
        // Get schedule data
        const { data: work } = await admin
            .from('works')
            .select('schedule_data')
            .eq('id', workId)
            .single();
        
        console.log('[initializeActivitiesFromSchedule] Schedule data exists:', !!work?.schedule_data);
        
        if (!work?.schedule_data) {
            return { success: false, error: 'No schedule data found' };
        }
        
        const scheduleData = JSON.parse(work.schedule_data);
        console.log('[initializeActivitiesFromSchedule] Parsed schedule data');
        
        // Handle both old and new format
        let tasksToSync = [];
        if (scheduleData.customTasks && Array.isArray(scheduleData.customTasks)) {
            tasksToSync = scheduleData.customTasks;
        } else if (scheduleData.data && Array.isArray(scheduleData.data)) {
            tasksToSync = scheduleData.data;
        }
        
        console.log('[initializeActivitiesFromSchedule] Tasks to sync:', tasksToSync.length);
        
        if (tasksToSync.length === 0) {
            return { success: false, error: 'No tasks in schedule data' };
        }
        
        // Check if activities already exist
        const { data: existing } = await admin
            .from('work_activities')
            .select('id')
            .eq('work_id', workId)
            .limit(1);
        
        if (existing && existing.length > 0) {
            console.log('[initializeActivitiesFromSchedule] Activities already exist');
            return { success: false, error: 'Activities already initialized' };
        }
        
        // Create activities from schedule
        const activities = tasksToSync.map((task: any, index: number) => {
            // Normalize progress: if > 1, it's already percentage
            let progressPercentage = (task.progress || 0);
            if (progressPercentage <= 1) {
                progressPercentage = progressPercentage * 100;
            }
            
            return {
                work_id: workId,
                activity_code: String(task.id),
                activity_name: task.text,
                parent_activity_id: null,
                is_main_activity: task.type === 'project' || task.isMainActivity || false,
                start_date: task.start_date || null,
                end_date: task.end_date || null,
                duration: task.duration || null,
                progress_percentage: progressPercentage,
                display_order: index
            };
        });
        
        console.log('[initializeActivitiesFromSchedule] Inserting activities:', activities.length);
        
        // Insert activities
        const { data: inserted, error: insertError } = await admin
            .from('work_activities')
            .insert(activities)
            .select();
        
        if (insertError) {
            console.error('[initializeActivitiesFromSchedule] Insert error:', insertError);
            throw insertError;
        }
        
        console.log('[initializeActivitiesFromSchedule] Inserted:', inserted?.length);
        
        // Update parent relationships
        if (inserted) {
            for (const task of tasksToSync) {
                if (task.parent) {
                    const child = inserted.find(a => a.activity_code === String(task.id));
                    const parent = inserted.find(a => a.activity_code === String(task.parent));
                    
                    if (child && parent) {
                        await admin
                            .from('work_activities')
                            .update({ parent_activity_id: parent.id })
                            .eq('id', child.id);
                    }
                }
            }
        }
        
        revalidatePath(`/dashboard/work/${workId}`);
        revalidatePath(`/dashboard/work/${workId}/schedule`);
        
        return { success: true, data: inserted };
    } catch (error) {
        console.error('Failed to initialize activities:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Bulk update activities progress (for progress update form)
 */
export async function bulkUpdateActivitiesProgress(
    workId: number,
    updates: { activityCode: string; progress: number }[]
) {
    try {
        const { admin } = await createSupabaseServerClient();
        
        // Get activities
        const { data: activities } = await admin
            .from('work_activities')
            .select('*')
            .eq('work_id', workId);
        
        if (!activities) throw new Error('Activities not found');
        
        // Update each activity
        for (const update of updates) {
            const activity = activities.find(a => a.activity_code === update.activityCode);
            if (activity) {
                await admin
                    .from('work_activities')
                    .update({ 
                        progress_percentage: update.progress,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', activity.id);
            }
        }
        
        // Sync with schedule
        await syncScheduleWithActivities(workId);
        
        revalidatePath(`/dashboard/work/${workId}`);
        revalidatePath(`/dashboard/work/${workId}/schedule`);
        
        return { success: true };
    } catch (error) {
        console.error('Failed to bulk update activities:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
