// @ts-nocheck
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { pushToGoogleSheet } from "@/app/(main)/admin/settings/actions";

export async function GET() {
  try {
    const { client: supabase, admin: supabaseAdmin } = await createSupabaseServerClient();
    // Check authentication using the client that has access to cookies
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    // Fetch all progress logs ordered by creation time
    const { data: progressLogs, error } = await supabaseAdmin
      .from("progress_logs")
      .select("id, work_id, new_progress, created_at")
      .order('created_at', { ascending: true });
    if (error) {
      console.error("Error fetching progress logs:", error);
      return NextResponse.json({ error: "Failed to fetch progress logs" }, { status: 500 });
    }
    return NextResponse.json(progressLogs || []);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const workId = Number(formData.get("workId"));
    const progress = Number(formData.get("progress"));
    const remark = formData.get("remark") as string | null;
    const expectedCompletionDate = formData.get("expectedCompletionDate") as string | null;
    const actualCompletionDate = formData.get("actualCompletionDate") as string | null;
    const billNo = formData.get("billNo") as string | null;
    const billAmount = formData.get("billAmount") ? Number(formData.get("billAmount")) : null;

    console.log("[API /progress-logs POST] Received request:", {
      workId,
      progress,
      remark,
      expectedCompletionDate,
      actualCompletionDate,
      billNo,
      billAmount
    });

    if (isNaN(workId) || isNaN(progress)) {
      console.error("[API /progress-logs POST] Invalid workId or progress:", { workId, progress });
      return NextResponse.json({ error: "Invalid workId or progress value" }, { status: 400 });
    }

    const { client: supabase, admin: supabaseAdmin } = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log("[API /progress-logs POST] User authenticated:", { userId: user?.id, email: user?.email });
    
    if (!user) {
      console.error("[API /progress-logs POST] No authenticated user");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get current work details to find previous progress
    console.log("[API /progress-logs POST] Fetching work details for workId:", workId);
    const { data: currentWork, error: workError } = await (supabaseAdmin as any)
      .from("works")
      .select("*")
      .eq("id", workId)
      .single();

    if (workError || !currentWork) {
      console.error("[API /progress-logs POST] Could not fetch current work details:", workError);
      return NextResponse.json({ error: "Could not fetch current work details" }, { status: 500 });
    }
    
    console.log("[API /progress-logs POST] Current work fetched:", {
      id: currentWork.id,
      work_name: currentWork.work_name,
      current_progress: currentWork.progress_percentage
    });

    // Get user's profile
    const { data: userProfile } = await (supabaseAdmin as any)
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const userDisplayName = userProfile?.full_name || user.email;

    // Insert progress log with previous progress
    console.log("[API /progress-logs POST] Inserting progress log");
    const { data: progressLogData, error: progressLogError } = await (supabaseAdmin as any)
      .from("progress_logs")
      .insert({
        work_id: workId,
        user_id: user.id,
        user_email: user.email,
        user_full_name: userDisplayName,
        previous_progress: currentWork.progress_percentage || 0,
        new_progress: progress,
        remark: remark || ""
      })
      .select()
      .single();

    if (progressLogError || !progressLogData) {
      console.error("[API /progress-logs POST] Progress log insert error:", progressLogError);
      return NextResponse.json({ error: "Failed to create progress log" }, { status: 500 });
    }
    
    console.log("[API /progress-logs POST] Progress log created:", { id: progressLogData.id });

    // Update the work with new progress and other details
    console.log("[API /progress-logs POST] Updating work with new progress");
    const updateData: any = {
      progress_percentage: progress,
      remark: remark,
      expected_completion_date: expectedCompletionDate || null,
      actual_completion_date: actualCompletionDate || null
    };

    if (billNo !== null || billAmount !== null) {
      updateData.bill_no = billNo;
      updateData.bill_amount_with_tax = billAmount;
    }

    const { error: updateError } = await (supabaseAdmin as any)
      .from("works")
      .update(updateData)
      .eq("id", workId);

    if (updateError) {
      console.error("[API /progress-logs POST] Error updating work:", updateError);
      return NextResponse.json({ error: "Failed to update work progress" }, { status: 500 });
    }
    
    console.log("[API /progress-logs POST] Work updated successfully");

    // CREATE PROGRESS UPDATE NOTIFICATIONS
    console.log(`📊 Progress updated from ${currentWork.progress_percentage}% to ${progress}% - Creating notifications...`);

    try {
      // Import getSettings helper
      const { getSettings } = await import("@/app/(main)/admin/settings/actions");

      // Get notification settings
      const settings = await getSettings(supabaseAdmin);
      let prefs = {};
      try {
        prefs = JSON.parse(settings.notification_preferences || '{}');
      } catch (e) {
        console.error("Error parsing notification preferences:", e);
        prefs = {};
      }

      // Fetch all users who should be notified
      const { data: allUsers } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, role, region, circle, division, subdivision")
        .neq("id", user.id); // Exclude the person who updated

      if (allUsers && allUsers.length > 0) {
        const progressNotifications: any[] = [];

        for (const userProfile of allUsers) {
          const { id, full_name, role, region, circle, division, subdivision } = userProfile;
          let shouldNotify = false;

          // Normalize role
          const normalizedRole = role?.toLowerCase() || '';

          // Check if user should receive notifications based on work hierarchy
          switch (normalizedRole) {
            case 'superadmin':
            case 'admin':
              shouldNotify = true;
              break;
            case 'je':
              shouldNotify = region === currentWork.je_name;
              break;
            case 'sub_division_head':
              shouldNotify = subdivision === currentWork.civil_sub_division;
              break;
            case 'division_head':
              shouldNotify = division === currentWork.civil_division;
              break;
            case 'circle_head':
              shouldNotify = circle === currentWork.civil_circle;
              break;
            case 'zone_head':
              shouldNotify = region === currentWork.civil_zone;
              break;
          }

          // Check progress_updates preference for this role
          if (shouldNotify) {
            const rolePrefs = prefs[normalizedRole] || {};
            if (rolePrefs.progress_updates !== false) {
              progressNotifications.push({
                user_id: id,
                work_id: workId,
                type: 'progress_update',
                message: `${userDisplayName} updated progress on "${currentWork.work_name}" from ${currentWork.progress_percentage || 0}% to ${progress}%`,
                created_by: user.id
              });
            }
          }
        }

        // Insert notifications
        if (progressNotifications.length > 0) {
          const { error: notifError } = await supabaseAdmin
            .from("notifications")
            .insert(progressNotifications);

          if (notifError) {
            console.error("Error creating progress notifications:", notifError);
          } else {
            console.log(`✅ Created ${progressNotifications.length} progress update notifications`);
          }
        } else {
          console.log("ℹ️ No users to notify for progress update (settings disabled or no matching hierarchy)");
        }
      }
    } catch (notifError) {
      console.error("Error in notification creation:", notifError);
      // Don't fail the whole request if notifications fail
    }


    // Sync to Google Sheets if scheme_sr_no exists
    if (currentWork?.scheme_sr_no) {
      console.log('=== API PROGRESS UPDATE GOOGLE SHEETS SYNC START ===');
      console.log('Scheme Sr No:', currentWork.scheme_sr_no);
      console.log('Progress:', progress);
      console.log('Remark:', remark);

      try {
        const syncResult = await pushToGoogleSheet({
          scheme_sr_no: currentWork.scheme_sr_no,
          progress_percentage: progress,
          remark: remark || '',
          bill_no: billNo || null,
          bill_amount_with_tax: billAmount,
          expected_completion_date: expectedCompletionDate,
          actual_completion_date: actualCompletionDate
        });
        console.log('Google Sheets sync result:', syncResult);
        console.log('=== API PROGRESS UPDATE GOOGLE SHEETS SYNC END ===');
      } catch (syncError) {
        console.error('=== API PROGRESS UPDATE GOOGLE SHEETS SYNC ERROR ===');
        console.error('Error:', syncError);
      }
    } else {
      console.warn('=== API PROGRESS UPDATE GOOGLE SHEETS SYNC SKIPPED ===');
      console.warn('Reason: No scheme_sr_no found');
      console.warn('Current work:', currentWork);
    }

    // Revalidate the work page and dashboard to show updated progress
    revalidatePath(`/dashboard/work/${workId}`);
    revalidatePath('/dashboard');

    console.log("[API /progress-logs POST] Success! Returning progressLogId:", progressLogData.id);
    return NextResponse.json({ progressLogId: progressLogData.id });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
