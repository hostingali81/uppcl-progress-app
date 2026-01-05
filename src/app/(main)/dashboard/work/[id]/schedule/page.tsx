import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SchedulePageClient } from './SchedulePageClient';

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
    const { client: supabase } = await createSupabaseServerClient();
    const resolvedParams = await params;
    const workId = parseInt(resolvedParams.id);

    // Fetch user data
    const { data: { user } } = await supabase.auth.getUser();
    let userName = 'User';

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single() as { data: { full_name: string } | null };

        if (profile?.full_name) {
            userName = profile.full_name;
        }
    }

    // Fetch work data
    const { data: work, error: workError } = await (supabase
        .from('works')
        .select('*')
        .eq('id', workId)
        .single() as any);

    if (workError || !work) {
        redirect('/dashboard');
        return null; // unreachable but satisfies TS
    }

    // Fetch latest progress log for remark
    const { data: latestProgressLog } = await (supabase
        .from('progress_logs')
        .select('remark, new_progress')
        .eq('work_id', workId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single() as any);

    // Add latest remark and progress to work object
    // Using a typed object construction to avoid spread/assign issues
    const workWithLatestData = {
        ...work,
        latest_remark: latestProgressLog?.remark || (work as any).reason || 'No updates yet',
        latest_progress: latestProgressLog?.new_progress ?? (work as any).progress ?? 0
    };

    return <SchedulePageClient work={workWithLatestData as any} userName={userName} />;
}
