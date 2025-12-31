// @ts-nocheck
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { syncScheduleWithActivities } from './activities-actions';

export async function saveScheduleData(workId: number, scheduleData: string) {
    try {
        const { admin } = await createSupabaseServerClient();
        
        console.log('[saveScheduleData] Saving for workId:', workId);
        console.log('[saveScheduleData] Data to save:', scheduleData);
        
        const { error } = await admin
            .from('works')
            .update({ schedule_data: scheduleData })
            .eq('id', workId);
        
        if (error) {
            console.error('Supabase error:', error);
            return { success: false, error: error.message || 'Database update failed' };
        }
        
        // Parse and sync activities
        try {
            const parsed = JSON.parse(scheduleData);
            console.log('[saveScheduleData] Parsed data:', parsed);
            
            // Check if it's the new format with customTasks
            let tasksToSync = [];
            if (parsed.customTasks && Array.isArray(parsed.customTasks)) {
                tasksToSync = parsed.customTasks;
            } else if (parsed.data && Array.isArray(parsed.data)) {
                tasksToSync = parsed.data;
            }
            
            console.log('[saveScheduleData] Tasks to sync:', tasksToSync.length);
            
            if (tasksToSync.length > 0) {
                // Delete existing activities
                await admin
                    .from('work_activities')
                    .delete()
                    .eq('work_id', workId);
                
                // Insert new activities
                const activities = tasksToSync.map((task: any, index: number) => ({
                    work_id: workId,
                    activity_code: String(task.id),
                    activity_name: task.text,
                    parent_activity_id: null,
                    is_main_activity: task.type === 'project' || task.isMainActivity || false,
                    start_date: task.start_date || null,
                    end_date: task.end_date || null,
                    duration: task.duration || null,
                    progress_percentage: (task.progress || 0) * 100,
                    display_order: index
                }));
                
                console.log('[saveScheduleData] Inserting activities:', activities.length);
                
                const { data: inserted, error: insertError } = await admin
                    .from('work_activities')
                    .insert(activities)
                    .select();
                
                if (insertError) {
                    console.error('[saveScheduleData] Insert error:', insertError);
                } else {
                    console.log('[saveScheduleData] Inserted activities:', inserted?.length);
                    
                    // Update parent relationships
                    if (inserted) {
                        for (const task of tasksToSync) {
                            if (task.parent) {
                                const child = inserted.find((a: any) => a.activity_code === String(task.id));
                                const parent = inserted.find((a: any) => a.activity_code === String(task.parent));
                                
                                if (child && parent) {
                                    await admin
                                        .from('work_activities')
                                        .update({ parent_activity_id: parent.id })
                                        .eq('id', child.id);
                                }
                            }
                        }
                    }
                }
            }
        } catch (activityError) {
            console.error('Failed to sync activities:', activityError);
        }
        
        revalidatePath(`/dashboard/work/${workId}/schedule`);
        revalidatePath(`/dashboard/work/${workId}`);
        return { success: true };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Failed to save schedule:', errorMsg);
        return { success: false, error: errorMsg };
    }
}

export async function loadScheduleData(workId: number) {
    try {
        const { admin } = await createSupabaseServerClient();
        
        // Get schedule data
        const { data, error } = await admin
            .from('works')
            .select('schedule_data')
            .eq('id', workId)
            .single();
        
        if (error) {
            console.error('Supabase error:', error);
            return { success: false, error: error.message || 'Failed to load data' };
        }
        
        // Get activities to sync progress
        const { data: activities } = await admin
            .from('work_activities')
            .select('*')
            .eq('work_id', workId);
        
        // If schedule data exists and activities exist, sync progress
        if (data?.schedule_data && activities && activities.length > 0) {
            const scheduleData = JSON.parse(data.schedule_data);
            
            // Update progress from activities
            const updatedData = scheduleData.data.map((task: any) => {
                const activity = activities.find(a => a.activity_code === task.id);
                if (activity) {
                    return {
                        ...task,
                        progress: activity.progress_percentage / 100
                    };
                }
                return task;
            });
            
            return { 
                success: true, 
                data: JSON.stringify({ ...scheduleData, data: updatedData })
            };
        }
        
        return { success: true, data: data?.schedule_data };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Failed to load schedule:', errorMsg);
        return { success: false, error: errorMsg };
    }
}
