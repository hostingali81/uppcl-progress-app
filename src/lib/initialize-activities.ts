// Utility script to initialize activities for all existing works
// Run this once after database migration

import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Initialize activities for all works that have schedule_data
 * Run this script once after creating the work_activities table
 */
export async function initializeAllWorkActivities() {
  try {
    const { admin } = await createSupabaseServerClient();
    
    // Get all works with schedule_data
    const { data: works, error } = await admin
      .from('works')
      .select('id, scheme_sr_no, work_name, schedule_data')
      .not('schedule_data', 'is', null) as { data: any[] | null, error: any };
    
    if (error) throw error;
    
    if (!works || works.length === 0) {
      console.log('No works found with schedule data');
      return { success: true, message: 'No works to process' };
    }
    
    console.log(`Found ${works.length} works with schedule data`);
    
    const results = {
      total: works.length,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as any[]
    };
    
    for (const work of works) {
      try {
        const workId = work.id as number;
        // Check if activities already exist
        const { data: existing } = await admin
          .from('work_activities')
          .select('id')
          .eq('work_id', workId)
          .limit(1);
        
        if (existing && existing.length > 0) {
          console.log(`Skipping work ${work.id} - activities already exist`);
          results.skipped++;
          continue;
        }
        
        // Parse schedule data
        const scheduleData = JSON.parse(work.schedule_data);
        
        if (!scheduleData.data || scheduleData.data.length === 0) {
          console.log(`Skipping work ${work.id} - no activities in schedule`);
          results.skipped++;
          continue;
        }
        
        // Create activities
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
        
        // Insert activities
        const { data: inserted, error: insertError } = await admin
          .from('work_activities')
          .insert(activities)
          .select() as { data: any[] | null, error: any };
        
        if (insertError) throw insertError;
        
        // Update parent relationships
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
        
        console.log(`✓ Initialized ${inserted?.length || 0} activities for work ${workId} (${work.scheme_sr_no})`);
        results.success++;
        
      } catch (error) {
        console.error(`✗ Failed to initialize work ${work.id}:`, error);
        results.failed++;
        results.errors.push({
          workId: work.id,
          schemeSrNo: work.scheme_sr_no,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log('\n=== Initialization Complete ===');
    console.log(`Total works: ${results.total}`);
    console.log(`Successfully initialized: ${results.success}`);
    console.log(`Skipped (already initialized): ${results.skipped}`);
    console.log(`Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(err => {
        console.log(`- Work ${err.workId} (${err.schemeSrNo}): ${err.error}`);
      });
    }
    
    return {
      success: true,
      results
    };
    
  } catch (error) {
    console.error('Failed to initialize activities:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Initialize activities for a specific work
 */
export async function initializeWorkActivities(workId: number) {
  try {
    const { admin } = await createSupabaseServerClient();
    
    // Get work with schedule data
    const { data: work, error } = await admin
      .from('works')
      .select('id, schedule_data')
      .eq('id', workId)
      .single() as { data: any | null, error: any };
    
    if (error) throw error;
    
    if (!work.schedule_data) {
      return { success: false, error: 'No schedule data found' };
    }
    
    // Check if activities already exist
    const { data: existing } = await admin
      .from('work_activities')
      .select('id')
      .eq('work_id', workId)
      .limit(1);
    
    if (existing && existing.length > 0) {
      return { success: false, error: 'Activities already initialized' };
    }
    
    // Parse and create activities
    const scheduleData = JSON.parse(work.schedule_data);
    
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
    
    // Update parent relationships
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
    
    return {
      success: true,
      data: inserted,
      message: `Initialized ${inserted?.length || 0} activities`
    };
    
  } catch (error) {
    console.error('Failed to initialize activities:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
