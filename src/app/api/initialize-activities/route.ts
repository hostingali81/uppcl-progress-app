import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    
    const { admin } = await createSupabaseServerClient();
    
    const { data: works, error } = await admin
      .from('works')
      .select('id, scheme_sr_no, schedule_data')
      .not('schedule_data', 'is', null) as { data: any[] | null, error: any };
    
    if (error) throw error;
    
    if (!works || works.length === 0) {
      return NextResponse.json({ success: true, message: 'No works found' });
    }
    
    const results = { total: works.length, success: 0, skipped: 0, failed: 0, errors: [] as any[] };
    
    for (const work of works) {
      try {
        const workId = work.id as number;
        const { data: existing } = await admin
          .from('work_activities')
          .select('id')
          .eq('work_id', workId)
          .limit(1);
        
        if (existing && existing.length > 0 && !force) {
          results.skipped++;
          continue;
        }
        
        // Delete existing if force
        if (force && existing && existing.length > 0) {
          await admin
            .from('work_activities')
            .delete()
            .eq('work_id', workId);
        }
        
        const scheduleData = JSON.parse(work.schedule_data);
        if (!scheduleData.data || scheduleData.data.length === 0) {
          results.skipped++;
          continue;
        }
        
        const activities = scheduleData.data.map((task: any, index: number) => ({
          work_id: workId,
          activity_code: task.id,
          activity_name: task.text,
          parent_activity_id: null,
          is_main_activity: task.type === 'project' || task.isMainActivity || false,
          start_date: task.start_date || null,
          end_date: task.end_date || null,
          duration: task.duration || null,
          progress_percentage: (task.progress || 0) * 100,
          display_order: index
        }));
        
        const { data: inserted, error: insertError } = await admin
          .from('work_activities')
          .insert(activities)
          .select() as { data: any[] | null, error: any };
        
        if (insertError) throw insertError;
        
        if (inserted) {
          for (const task of scheduleData.data) {
            if (task.parent) {
              const child = inserted.find((a: any) => a.activity_code === task.id);
              const parent = inserted.find((a: any) => a.activity_code === task.parent);
              
              if (child && parent) {
                await (admin as any)
                  .from('work_activities')
                  .update({ parent_activity_id: parent.id })
                  .eq('id', child.id);
              }
            }
          }
        }
        
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          workId: work.id,
          error: error instanceof Error ? error.message : 'Unknown'
        });
      }
    }
    
    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
