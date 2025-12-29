// @ts-nocheck
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveScheduleData(workId: number, scheduleData: string) {
    try {
        const { admin } = await createSupabaseServerClient();
        
        const { error } = await admin
            .from('works')
            .update({ schedule_data: scheduleData })
            .eq('id', workId);
        
        if (error) {
            console.error('Supabase error:', error);
            return { success: false, error: error.message || 'Database update failed' };
        }
        
        revalidatePath(`/dashboard/work/${workId}/schedule`);
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
