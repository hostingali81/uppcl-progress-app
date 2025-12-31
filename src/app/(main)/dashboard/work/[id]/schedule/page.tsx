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
    const { data: work, error: workError } = await supabase
        .from('works')
        .select('*')
        .eq('id', workId)
        .single();

    if (workError || !work) {
        redirect('/dashboard');
    }

    return <SchedulePageClient work={work} userName={userName} />;
}
