import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SchedulePageClient } from './SchedulePageClient';

export default async function SchedulePage({ params }: { params: { id: string } }) {
    const { client: supabase } = await createSupabaseServerClient();
    const resolvedParams = await params;
    const workId = parseInt(resolvedParams.id);

    // Fetch work data
    const { data: work, error: workError } = await supabase
        .from('works')
        .select('*')
        .eq('id', workId)
        .single();

    if (workError || !work) {
        redirect('/dashboard');
    }

    return <SchedulePageClient work={work} />;
}
