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
        
        if (error) throw error;
        
        revalidatePath(`/dashboard/work/${workId}/schedule`);
        return { success: true };
    } catch (error) {
        console.error('Failed to save schedule:', error);
        return { success: false, error: String(error) };
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
        
        if (error) throw error;
        
        return { success: true, data: data?.schedule_data };
    } catch (error) {
        console.error('Failed to load schedule:', error);
        return { success: false, error: String(error) };
    }
}
