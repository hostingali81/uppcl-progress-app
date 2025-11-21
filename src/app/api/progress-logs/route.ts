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

    const { client: supabase, admin: supabaseAdmin } = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get current work details to find previous progress
    const { data: currentWork, error: workError } = await (supabaseAdmin as any)
      .from("works")
      .select("*")
      .eq("id", workId)
      .single();

    if (workError || !currentWork) {
      console.error("Could not fetch current work details:", workError);
      return NextResponse.json({ error: "Could not fetch current work details" }, { status: 500 });
    }

    // Get user's profile
    const { data: userProfile } = await (supabaseAdmin as any)
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const userDisplayName = userProfile?.full_name || user.email;

    // Insert progress log with previous progress
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
      console.error("Progress log insert error:", progressLogError);
      return NextResponse.json({ error: "Failed to create progress log" }, { status: 500 });
    }

    // Update the work with new progress and other details
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
      console.error("Error updating work:", updateError);
      return NextResponse.json({ error: "Failed to update work progress" }, { status: 500 });
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

    return NextResponse.json({ progressLogId: progressLogData.id });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
