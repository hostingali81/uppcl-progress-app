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
                // Get existing activities
                const { data: existingActivities } = await admin
                    .from('work_activities')
                    .select('*')
                    .eq('work_id', workId);

                const existingMap = new Map((existingActivities || []).map(a => [a.activity_code, a]));
                const processedCodes = new Set<string>();

                // Update or insert activities
                for (let index = 0; index < tasksToSync.length; index++) {
                    const task = tasksToSync[index];
                    const activityCode = String(task.id);
                    processedCodes.add(activityCode);

                    // Normalize progress
                    let progressPercentage = (task.progress || 0);
                    if (progressPercentage <= 1) {
                        progressPercentage = progressPercentage * 100;
                    }

                    const existing = existingMap.get(activityCode);

                    if (existing) {
                        // UPDATE existing - preserve dates, only update progress and name
                        await admin
                            .from('work_activities')
                            .update({
                                activity_name: task.text,
                                progress_percentage: progressPercentage,
                                is_main_activity: task.type === 'project' || task.isMainActivity || false,
                                display_order: index,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', existing.id);
                    } else {
                        // INSERT new activity
                        await admin
                            .from('work_activities')
                            .insert({
                                work_id: workId,
                                activity_code: activityCode,
                                activity_name: task.text,
                                parent_activity_id: null,
                                is_main_activity: task.type === 'project' || task.isMainActivity || false,
                                start_date: task.start_date || null,
                                end_date: task.end_date || null,
                                duration: task.duration || null,
                                progress_percentage: progressPercentage,
                                display_order: index
                            });
                    }
                }

                // Delete activities that are no longer in schedule
                const toDelete = (existingActivities || []).filter(a => !processedCodes.has(a.activity_code));
                if (toDelete.length > 0) {
                    await admin
                        .from('work_activities')
                        .delete()
                        .in('id', toDelete.map(a => a.id));
                }

                console.log('[saveScheduleData] Updated/Inserted activities:', tasksToSync.length);
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

        return { success: true, data: data?.schedule_data };


    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Failed to load schedule:', errorMsg);
        return { success: false, error: errorMsg };
    }
}
