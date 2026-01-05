import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { workId } = await request.json();
    
    if (!workId) {
      return NextResponse.json({ error: 'Work ID is required' }, { status: 400 });
    }

    const { admin } = await createSupabaseServerClient();

    // Delete existing activities
    await admin
      .from('work_activities')
      .delete()
      .eq('work_id', workId);

    // Re-initialize from schedule
    const { initializeActivitiesFromSchedule } = await import('@/app/(main)/dashboard/work/[id]/activities-actions');
    const result = await initializeActivitiesFromSchedule(workId);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Activities re-initialized successfully' });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to re-initialize activities:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
