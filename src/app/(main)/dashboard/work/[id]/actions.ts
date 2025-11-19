// src/app/(main)/dashboard/work/[id]/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { google } from "googleapis";
import { getSettings } from "@/app/(main)/admin/settings/actions";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// ====================================================================
// These functions remain unchanged
// ====================================================================

function toColumnName(num: number): string {
    let columnName = "";
    while (num > 0) {
      const remainder = (num - 1) % 26;
      columnName = String.fromCharCode(65 + remainder) + columnName;
      num = Math.floor((num - 1) / 26);
    }
    return columnName;
}

async function updateGoogleSheet(
  workSrNo: string,
  newProgress: number,
  newRemark: string,
  newBillNo?: string | null,
  newBillAmount?: number | null
) {
    try {
        const { client: supabase } = await createSupabaseServerClient();
        const settings = await getSettings(supabase);
        const sheetId = settings.google_sheet_id;
        const sheetName = settings.google_sheet_name;
        const credentialsString = settings.google_service_account_credentials;
        if (!sheetId || !sheetName || !credentialsString) { return; }
        const credentials = JSON.parse(credentialsString);
        const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
        const sheets = google.sheets({ version: 'v4', auth });
        const readData = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: sheetName });
        const rows = readData.data.values;
        if (!rows) throw new Error("No data in sheet.");
  const headers = rows[0];
  const srNoColIndex = headers.indexOf('Sr. No. OF SCEME');
  const progressColIndex = headers.indexOf('Present Progress in %');
  const remarkColIndex = headers.indexOf('Remark');
  if (srNoColIndex === -1 || progressColIndex === -1 || remarkColIndex === -1) { throw new Error("Required columns not found."); }
        const rowIndex = rows.findIndex(row => row[srNoColIndex] === workSrNo);
        if (rowIndex === -1) return;
        const rowNumber = rowIndex + 1;
    const progressColumnLetter = toColumnName(progressColIndex + 1);
    const remarkColumnLetter = toColumnName(remarkColIndex + 1);
    await sheets.spreadsheets.values.update({ spreadsheetId: sheetId, range: `${sheetName}!${progressColumnLetter}${rowNumber}`, valueInputOption: 'USER_ENTERED', requestBody: { values: [[`${newProgress}%`]] } });
    await sheets.spreadsheets.values.update({ spreadsheetId: sheetId, range: `${sheetName}!${remarkColumnLetter}${rowNumber}`, valueInputOption: 'USER_ENTERED', requestBody: { values: [[newRemark]] } });

    // Optional: update Bill No and Bill Amount (Incl. Tax) if those headers exist
    const billNoColIndex = headers.indexOf('Bill No');
    const billAmountColIndex = headers.indexOf('Bill Amount (Incl. Tax)');

    if (billNoColIndex !== -1) {
      const billNoColLetter = toColumnName(billNoColIndex + 1);
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${sheetName}!${billNoColLetter}${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[newBillNo || '']] }
      });
    }

    if (billAmountColIndex !== -1) {
      const billAmountColLetter = toColumnName(billAmountColIndex + 1);
      const amountValue = (typeof newBillAmount === 'number') ? String(newBillAmount) : '';
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${sheetName}!${billAmountColLetter}${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[amountValue]] }
      });
    }
        console.log(`Google Sheet updated for Sr. No. ${workSrNo}`);
    } catch (error: unknown) {
        console.error("CRITICAL: Failed to update Google Sheet:", error instanceof Error ? error.message : 'Unknown error');
    }
}

export async function updateWorkProgress(formData: FormData) {
  console.log("Starting updateWorkProgress");

  const { client: supabase, admin: supabaseAdmin } = await createSupabaseServerClient();

  const workId = formData.get("workId");
  const progress = formData.get("progress");
  const remark = formData.get("remark") as string | null;
  const billNo = formData.get("billNo") as string | null;
  const billAmount = formData.get("billAmount");
  const expectedCompletionDate = formData.get("expectedCompletionDate") as string | null;
  const actualCompletionDate = formData.get("actualCompletionDate") as string | null;

  console.log("Form data:", { workId, progress, remark, billNo, billAmount, expectedCompletionDate, actualCompletionDate });

  const workIdNumber = Number(workId);
  const progressNumber = Number(progress);
  const billAmountNumber = billAmount ? Number(billAmount) : null;

  console.log("Parsed data:", { workIdNumber, progressNumber, billAmountNumber });

  if (isNaN(workIdNumber) || isNaN(progressNumber)) {
    redirect(`/dashboard/work/${workId}?error=${encodeURIComponent("Invalid work ID or progress value.")}`);
  }

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log("Auth result:", { user: !!user, authError });

  if (authError || !user) {
    redirect(`/dashboard/work/${workId}?error=${encodeURIComponent("Authentication required.")}`);
  }

  const { data: currentWork, error: fetchError } = await supabaseAdmin
    .from("works")
    .select("*")
    .eq("id", workIdNumber)
    .single();

  console.log("Current work fetch:", { currentWork: !!currentWork, fetchError });

  if (fetchError || !currentWork) {
    console.error("Could not fetch current work details:", fetchError);
    redirect(`/dashboard/work/${workId}?error=${encodeURIComponent("Could not fetch current work details.")}`);
  }

  const updateData = {
    progress_percentage: progressNumber,
    remark,
    bill_no: billNo || null,
    bill_amount_with_tax: billAmountNumber,
    expected_completion_date: expectedCompletionDate || null,
    actual_completion_date: actualCompletionDate || null,
  };

  console.log("Update data:", updateData);

  const { error: updateError } = await supabaseAdmin
    .from("works")
    .update(updateData)
    .eq("id", workIdNumber);

  if (updateError) {
    console.error("Error updating work:", updateError);
    redirect(`/dashboard/work/${workId}?error=${encodeURIComponent("Failed to update work progress.")}`);
  }

  // Get user's profile
  const { data: userProfile } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const userDisplayName = userProfile?.full_name || user.email;

  // Log progress update - skip if fails, don't block the main update
  try {
    const { data: progressLogData, error: progressLogError } = await supabaseAdmin
      .from("progress_logs")
      .insert({
        work_id: workIdNumber,
        user_id: user.id,
        user_email: user.email,
        user_full_name: userDisplayName,
        previous_progress: currentWork.progress_percentage || 0,
        new_progress: progressNumber,
        remark: remark || ""
      })
      .select()
      .single();

    if (progressLogError) {
      console.error("Progress log insert error:", progressLogError);
    } else if (progressLogData) {
      // Link recent attachments to this progress log
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      await supabaseAdmin
        .from("attachments")
        .update({ progress_log_id: progressLogData.id })
        .eq("work_id", workIdNumber)
        .eq("uploader_id", user.id)
        .gte("created_at", fiveMinutesAgo)
        .is("progress_log_id", null);
    }
  } catch (logError) {
    console.error("Progress logging failed:", logError);
  }



  // Log payment update if bill details provided
  if (billNo || billAmountNumber) {
    const { error: paymentLogError } = await supabaseAdmin
      .from("payment_logs")
      .insert({
        work_id: workIdNumber,
        user_id: user.id,
        user_email: userDisplayName,
        previous_bill_no: currentWork.bill_no,
        previous_bill_amount: currentWork.bill_amount_with_tax,
        new_bill_no: billNo,
        new_bill_amount: billAmountNumber,
        remark: remark || ""
      });

    if (paymentLogError) {
      console.error("Failed to insert payment log:", paymentLogError);
      // Continue, don't fail the whole update
    }
  }

  // Update Google Sheet if scheme number exists and we have all required data
  if (currentWork.scheme_sr_no && typeof remark === 'string') {
    await updateGoogleSheet(
      currentWork.scheme_sr_no,
      progressNumber,
      remark,
      billNo?.toString() || '',
      billAmountNumber
    );
  }

  revalidatePath(`/dashboard/work/${workId}`);
  redirect(`/dashboard/work/${workId}?success=${encodeURIComponent("Progress updated successfully!")}`);
}

// File upload is now handled directly in the /api/upload route
// This avoids any issues with FormData serialization between client and server action

export async function addAttachmentToWork(workId: number, fileUrl: string, fileName: string, attachmentType: string = 'site_photo') {
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return { error: "Authentication required." }; }
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const { error } = await supabase.from("attachments").insert({ work_id: workId, file_url: fileUrl, file_name: fileName, uploader_id: user.id, uploader_full_name: profile?.full_name || user.email, attachment_type: attachmentType });
  if (error) { return { error: `Could not save attachment: ${error.message}` }; }
  revalidatePath(`/(main)/dashboard/work/${workId}`);
  return { success: "File attached successfully!" };
}

export async function deleteAttachment(attachmentId: number, workId: number) {
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return { error: "Authentication required." }; }
  const { data: attachment, error: fetchError } = await supabase.from("attachments").select("file_url").eq("id", attachmentId).single();
  if (fetchError || !attachment) { return { error: "File not found or permission denied." }; }
  try {
    const settings = await getSettings(supabase);
    const accountId = settings.cloudflare_account_id;
    const accessKeyId = settings.cloudflare_access_key_id;
    const secretAccessKey = settings.cloudflare_secret_access_key;
    const bucketName = settings.cloudflare_r2_bucket_name;
    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) { throw new Error("Cloudflare settings missing."); }
    const s3Client = new S3Client({ region: "auto", endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey }, });
    const fileKey = attachment.file_url.split('/').slice(3).join('/');
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: fileKey }));
  } catch (r2Error: unknown) {
    console.error("Failed to delete file from R2:", r2Error instanceof Error ? r2Error.message : 'Unknown error');
    return { error: "Could not delete file from storage." };
  }
  const { error: deleteError } = await supabase.from("attachments").delete().eq("id", attachmentId);
  if (deleteError) { return { error: `Could not delete attachment from database: ${deleteError.message}` }; }
  revalidatePath(`/(main)/dashboard/work/${workId}`);
  return { success: "File deleted successfully." };
}

export async function addComment(workId: number, content: string, mentionedUserIds: string[] = []) {
  const { client: supabase, admin: supabaseAdmin } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return { error: "Authentication required." }; }
  if (!content || content.trim() === '') { return { error: "Comment cannot be empty." }; }

  const { data: profile } = await supabaseAdmin.from("profiles").select("full_name").eq("id", user.id).single();
  const userDisplayName = profile?.full_name || user.email || 'A user';

  const { data: commentData, error } = await supabaseAdmin.from("comments").insert({
    work_id: workId,
    user_id: user.id,
    user_full_name: userDisplayName,
    content: content
  }).select().single();

  if (error) {
    console.error("Error posting comment:", error);
    return { error: `Could not post comment: ${error.message}` };
  }

  // Get the work details to determine hierarchy
  const { data: work } = await supabaseAdmin
    .from("works")
    .select("civil_zone, civil_circle, civil_division, civil_sub_division, work_name")
    .eq("id", workId)
    .single();

  // Get all users who should get hierarchy notifications for this work
  if (work) {
    const hierarchyNotifications: any[] = [];
    const mentionNotifications: any[] = [];

    // Get ALL users who should receive notifications based on work hierarchy
    // This is broader than just the users who can see the work on their dashboard
    const { data: allUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, role, region, circle, division, subdivision")
      .neq("id", user.id); // Exclude the commenter themselves

    if (allUsers && allUsers.length > 0) {
      // Create notifications for users who would have access to this work's hierarchy
      allUsers.forEach((userProfile: {
        id: string;
        full_name: string | null;
        role: string;
        region: string | null;
        circle: string | null;
        division: string | null;
        subdivision: string | null;
      }) => {
        const { id, full_name, role, region, circle, division, subdivision } = userProfile;
        let shouldNotify = false;

        // Check if user should receive notifications based on work hierarchy
        switch (role) {
          case 'superadmin':
          case 'admin':
            // Admins get notifications for all works
            shouldNotify = true;
            break;
          case 'je':
            // JE gets notification if their region matches the work's je_name
            shouldNotify = region === work.je_name;
            break;
          case 'sub_division_head':
            // Sub-division head gets notification if their subdivision matches work's subdivision
            shouldNotify = subdivision === work.civil_sub_division;
            break;
          case 'division_head':
            // Division head gets notification if their division matches work's division
            shouldNotify = division === work.civil_division;
            break;
          case 'circle_head':
            // Circle head gets notification if their circle matches work's circle
            shouldNotify = circle === work.civil_circle;
            break;
          case 'zone_head':
            // Zone head gets notification if their zone matches work's zone
            shouldNotify = region === work.civil_zone;
            break;
        }

        if (shouldNotify) {
          // Check if this user was mentioned
          const isMentioned = mentionedUserIds.includes(id);

          if (isMentioned) {
            // Create mention notification (higher priority)
            mentionNotifications.push({
              user_id: id,
              work_id: workId,
              comment_id: commentData.id,
              type: 'mention' as const,
              message: `${userDisplayName} mentioned you in a comment on "${work.work_name}".`,
              created_by: user.id
            });
          } else {
            // Create hierarchy notification for users who can see this work
            hierarchyNotifications.push({
              user_id: id,
              work_id: workId,
              comment_id: commentData.id,
              type: 'comment' as const,
              message: `${userDisplayName} commented on "${work.work_name}": ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
              created_by: user.id
            });
          }
        }
      });
    }

    console.log(`Work ID ${workId} - notifying ${hierarchyNotifications.length} users + ${mentionNotifications.length} mentions`);

    // Insert hierarchy notifications (regular comments)
    if (hierarchyNotifications.length > 0) {
      const { error: hierarchyError } = await supabaseAdmin.from("notifications").insert(hierarchyNotifications);
      if (hierarchyError) {
        console.error("Error creating hierarchy notifications:", hierarchyError);
      }
    }

    // Insert mention notifications (higher priority)
    if (mentionNotifications.length > 0) {
      const { error: mentionError } = await supabaseAdmin.from("notifications").insert(mentionNotifications);
      if (mentionError) {
        console.error("Error creating mention notifications:", mentionError);
      }
    }
  }

  revalidatePath(`/dashboard/work/${workId}`);
  return { success: "Comment posted." };
}

export async function editComment(commentId: number, newContent: string) {
  const { client: supabase } = await createSupabaseServerClient();
  if (!newContent || newContent.trim() === '') { return { error: "Comment cannot be empty." }; }
  const { error } = await supabase.from("comments").update({ content: newContent, is_edited: true }).eq("id", commentId);
  if (error) { return { error: `Could not update comment: ${error.message}` }; }

  // Fetch the comment to obtain the work id so we can revalidate the correct work page
  try {
    const { data: updatedComment } = await supabase.from('comments').select('work_id').eq('id', commentId).single();
    const workId = (updatedComment as any)?.work_id;
    if (workId) {
      revalidatePath(`/dashboard/work/${workId}`);
    } else {
      // Fallback - revalidate dashboard list if work id unavailable
      revalidatePath('/dashboard');
    }
  } catch (e) {
    // Non-fatal - ensure at least the dashboard is revalidated
    revalidatePath('/dashboard');
  }
  return { success: "Comment updated." };
}

export async function deleteComment(commentId: number) {
  const { client: supabase } = await createSupabaseServerClient();
  const { error } = await supabase.from("comments").update({ content: "This comment has been deleted.", is_deleted: true }).eq("id", commentId);
  if (error) { return { error: `Could not delete comment: ${error.message}` }; }

  // Revalidate the work page corresponding to this comment
  try {
    const { data: updatedComment } = await supabase.from('comments').select('work_id').eq('id', commentId).single();
    const workId = (updatedComment as any)?.work_id;
    if (workId) {
      revalidatePath(`/dashboard/work/${workId}`);
    } else {
      revalidatePath('/dashboard');
    }
  } catch (e) {
    revalidatePath('/dashboard');
  }
  return { success: "Comment deleted." };
}

// ====================================================================
// New code starts from here
// ====================================================================

export async function toggleBlockerStatus(
  workId: number,
  status: boolean,
  remark: string | null
) {
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return { error: "Authentication required." }; }

  // Update work respecting RLS policies
  const { error } = await supabase
    .from("works")
    .update({
      is_blocked: status,
      blocker_remark: status ? remark : null // If unblocking, remove the remark
    })
    .eq("id", workId);

  if (error) {
    return { error: `Could not update blocker status: ${error.message}` };
  }

  // Refresh cache for both dashboard and work page
  revalidatePath(`/dashboard/work/${workId}`);
  revalidatePath(`/dashboard`);
  
  return { success: "Blocker status updated successfully." };
}

// Update MB/TECO/FICO status fields
export async function updateWorkStatuses(formData: FormData) {
  const { client: supabase } = await createSupabaseServerClient();
  const workId = Number(formData.get('workId'));
  const mbStatus = (formData.get('mbStatus') as string) || (formData.get('mb_status') as string) || null;
  const tecoStatus = (formData.get('tecoStatus') as string) || (formData.get('teco_status') as string) || null;
  const ficoStatus = (formData.get('ficoStatus') as string) || (formData.get('fico_status') as string) || null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !workId) return { error: 'Authentication or workId missing.' };
  // Fetch current values for audit logging
  const { data: currentWork } = await supabase.from('works').select('mb_status, teco_status, fico_status').eq('id', workId).single();

  const { error } = await supabase.from('works').update({
    mb_status: mbStatus,
    teco_status: tecoStatus,
    fico_status: ficoStatus,
    updated_at: new Date().toISOString()
  }).eq('id', workId);

  if (error) {
    return { error: `Could not update status: ${error.message}` };
  }

  // Insert an audit comment summarizing status changes (user-facing log)
  try {
    const changes: string[] = [];
    if (currentWork) {
      if ((currentWork.mb_status || '') !== (mbStatus || '')) changes.push(`MB Status: "${currentWork.mb_status || 'Not set'}" → "${mbStatus || 'Not set'}"`);
      if ((currentWork.teco_status || '') !== (tecoStatus || '')) changes.push(`TECO Status: "${currentWork.teco_status || 'Not set'}" → "${tecoStatus || 'Not set'}"`);
      if ((currentWork.fico_status || '') !== (ficoStatus || '')) changes.push(`FICO Status: "${currentWork.fico_status || 'Not set'}" → "${ficoStatus || 'Not set'}"`);
    }

    if (changes.length > 0) {
      const changeText = `Status updated by ${user.email}: ` + changes.join('; ');
      await supabase.from('comments').insert({
        work_id: workId,
        user_id: user.id,
        user_full_name: user.email,
        content: changeText
      });
    }
  } catch (logErr) {
    // non-fatal - audit logging failed
    console.error('Failed to write status audit comment:', logErr);
  }

  // Revalidate work and dashboard pages
  try {
    revalidatePath(`/dashboard/work/${workId}`);
    revalidatePath('/dashboard');
  } catch (e) {
    // ignore
  }

  return { success: 'Status updated successfully.' };
}

// Zod schema for billing update validation
const billingUpdateSchema = z.object({
  workId: z.number(),
  billNo: z.string().min(1, "Bill number is required."),
  billAmount: z.number().positive("Bill amount must be positive."),
  remark: z.string().optional(),
});

export async function updateBillingDetails(data: {
  workId: number;
  billNo: string;
  billAmount: number;
  remark?: string;
}) {
  const { admin: supabaseAdmin, client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Authentication required." };
  }

  const validation = billingUpdateSchema.safeParse(data);
  if (!validation.success) {
    return { error: `Invalid input: ${validation.error.issues.map((e) => e.message).join(', ')}` };
  }

  const { workId, billNo, billAmount, remark } = validation.data;

  // Get user's full name for logging
  const { data: profile } = await supabaseAdmin.from("profiles").select("full_name").eq("id", user.id).single();
  const displayName = profile?.full_name || user.email || 'Unknown User';

  // Insert a new payment log
  const { error: paymentLogError } = await supabaseAdmin.from("payment_logs").insert({
    work_id: workId,
    user_id: user.id,
    user_email: displayName,
    new_bill_no: billNo,
    new_bill_amount: billAmount,
    remark: remark,
  });

  if (paymentLogError) {
    console.error("Failed to insert payment log:", paymentLogError);
    return { error: `Database Error: Could not log payment. ${paymentLogError.message}` };
  }

  revalidatePath(`/dashboard/work/${workId}`);
  revalidatePath("/dashboard");

  return { success: "Billing details updated successfully!" };
}

// New function to fetch work details for the work detail page
// Fetch unique values for autocomplete suggestions
export async function fetchFieldSuggestions(fieldName: string) {
  const { admin: supabaseAdmin } = await createSupabaseServerClient();
  
  const { data } = await supabaseAdmin
    .from('works')
    .select(fieldName)
    .not(fieldName, 'is', null)
    .limit(100);
  
  if (!data) return [];
  
  const uniqueValues = [...new Set(data.map((row: any) => row[fieldName]).filter(Boolean))];
  return uniqueValues.sort();
}

export async function fetchWorkDetails(workId: number) {
  const { client: supabase, admin: supabaseAdmin } = await createSupabaseServerClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }

  // Fetch work with attachments
  const workPromise = supabase
    .from("works")
    .select(`*, attachments (*)`)
    .eq("id", workId)
    .single();

  // Fetch all users for mentions
  const usersPromise = supabaseAdmin.from("profiles").select('id, full_name, email');

  // Fetch current user's profile
  const profilePromise = supabase.from("profiles").select('role').eq('id', user.id).single();

  // Fetch progress logs with user names
  const progressLogsPromise = supabaseAdmin
    .from("progress_logs")
    .select(
      `id, work_id, user_id, user_email, user_full_name, previous_progress, new_progress, remark, created_at`
    )
    .eq('work_id', workId)
    .order('created_at', { ascending: false });

  // Fetch attachments for ProgressPhotosSection (all attachments for this work)
  const allAttachmentsPromise = supabaseAdmin
    .from("attachments")
    .select('id, file_url, file_name, created_at, attachment_type, uploader_id, uploader_full_name')
    .eq('work_id', workId);

  // Fetch attachments linked to progress logs separately
  const progressAttachmentsPromise = supabaseAdmin
    .from("attachments")
    .select('id, file_url, file_name, created_at, attachment_type, progress_log_id')
    .eq('work_id', workId)
    .not('progress_log_id', 'is', null);

  // Fetch comments
  const commentsPromise = supabase
    .from('comments')
    .select('*')
    .eq('work_id', workId)
    .order('created_at', { ascending: false });

  // Fetch payment logs
  const paymentLogsPromise = supabase
    .from('payment_logs')
    .select('id, work_id, user_id, created_at, user_email, previous_bill_no, previous_bill_amount, new_bill_no, new_bill_amount, remark')
    .eq('work_id', workId)
    .order('created_at', { ascending: false });

  const [
    { data: workRow, error: workError },
    { data: allUsers },
    { data: currentUserProfile },
    { data: progressLogs },
    { data: allAttachments },
    { data: progressAttachments },
    { data: paymentLogs },
    { data: comments }
  ] = await Promise.all([workPromise, usersPromise, profilePromise, progressLogsPromise, allAttachmentsPromise, progressAttachmentsPromise, paymentLogsPromise, commentsPromise]);

  if (workError || !workRow) {
    console.error('Work fetch failed:', {
      workId,
      workError: workError ? {
        message: workError.message || 'No message',
        code: workError.code || 'No code',
        details: workError.details || 'No details',
        hint: workError.hint || 'No hint'
      } : 'No error object',
      workRow,
      workRowExists: !!workRow
    });

    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Work not found or fetch error. workId=${workId}`);
    }
    throw new Error('Work not found');
  }

  const work = workRow as any;
  const allUsersData = (allUsers || []) as any[];
  const currentUserProfileData = currentUserProfile as any;
  const progressLogsData = (progressLogs || []) as any[];
  const progressAttachmentsData = (progressAttachments || []) as any[];
  const paymentLogsData = (paymentLogs || []) as any[];

  // Link attachments to progress logs
  const progressLogsWithAttachments = progressLogsData.map(log => ({
    ...log,
    attachments: progressAttachmentsData.filter(att => att.progress_log_id === log.id)
  }));

  // Build mention users list - include all users
  const usersForMentions = allUsersData && allUsersData.length > 0 ? allUsersData
    .filter(u => u.id !== user.id) // Exclude current user
    .map(u => ({ id: u.id, display: u.full_name || u.email })) // Use full_name, fallback to email
    .filter(u => u.display) : []; // Ensure display name exists

  console.log('Mention users available:', usersForMentions.length, usersForMentions.slice(0, 3));

  const currentUserRole = currentUserProfileData?.role || 'user';

  // Calculate billing summary
  const totalBillAmount = paymentLogsData?.reduce((sum: number, log: any) => sum + (log.new_bill_amount || 0), 0) || 0;
  const latestBill = paymentLogsData && paymentLogsData.length > 0 ? paymentLogsData[0] : null;
  const latestBillNumber = latestBill?.new_bill_no || 'N/A';

  return {
    work,
    usersForMentions,
    currentUserRole,
    currentUserId: user.id,
    totalBillAmount,
    latestBillNumber,
    paymentLogs: paymentLogs || [],
    progressLogs: progressLogsWithAttachments || [],
    comments: comments || [],
    allAttachments: allAttachments || []
  };
}
