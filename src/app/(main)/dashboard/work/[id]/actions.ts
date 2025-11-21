// src/app/(main)/dashboard/work/[id]/actions.ts
// @ts-nocheck
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { google } from "googleapis";
import { getSettings, pushToGoogleSheet } from "@/app/(main)/admin/settings/actions";
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
  const admin = supabaseAdmin as any;

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

  const { data: currentWork, error: fetchError } = await admin
    .from("works")
    .select("*")
    .eq("id", workIdNumber)
    .single();

  console.log("Current work fetch:", { currentWork: !!currentWork, fetchError });

  if (fetchError || !currentWork) {
    console.error("Could not fetch current work details:", fetchError);
    redirect(`/dashboard/work/${workId}?error=${encodeURIComponent("Could not fetch current work details.")}`);
  }

  const updateData: any = {
    progress_percentage: progressNumber,
    remark,
    bill_no: billNo || null,
    bill_amount_with_tax: billAmountNumber,
    expected_completion_date: expectedCompletionDate || null,
    actual_completion_date: actualCompletionDate || null,
  };

  console.log("Update data:", updateData);

  const { error: updateError } = await (admin as any)
    .from("works")
    .update(updateData)
    .eq("id", workIdNumber);

  if (updateError) {
    console.error("Error updating work:", updateError);
    redirect(`/dashboard/work/${workId}?error=${encodeURIComponent("Failed to update work progress.")}`);
  }

  // Get user's profile
  const { data: userProfile } = await (admin as any)
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const userDisplayName = userProfile?.full_name || user.email;

  // Log progress update - skip if fails, don't block the main update
  try {
    const { data: progressLogData, error: progressLogError } = await admin
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
      await admin
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
    const { error: paymentLogError } = await admin
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
  if (currentWork.scheme_sr_no) {
    console.log('=== PROGRESS UPDATE GOOGLE SHEETS SYNC START ===');
    console.log('Scheme Sr No:', currentWork.scheme_sr_no);
    console.log('Progress:', progressNumber);
    console.log('Remark:', remark);

    try {
      // Use the new pushToGoogleSheet function for consistency
      const syncResult = await pushToGoogleSheet({
        scheme_sr_no: currentWork.scheme_sr_no,
        progress_percentage: progressNumber,
        remark: remark || '',
        bill_no: billNo || null,
        bill_amount_with_tax: billAmountNumber,
        expected_completion_date: expectedCompletionDate,
        actual_completion_date: actualCompletionDate
      });
      console.log('Google Sheets sync result:', syncResult);
      console.log('=== PROGRESS UPDATE GOOGLE SHEETS SYNC END ===');
    } catch (syncError) {
      console.error('=== PROGRESS UPDATE GOOGLE SHEETS SYNC ERROR ===');
      console.error('Error:', syncError);
    }
  } else {
    console.warn('=== PROGRESS UPDATE GOOGLE SHEETS SYNC SKIPPED ===');
    console.warn('Reason: No scheme_sr_no found');
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

// Helper function for case-insensitive string comparison
function areStringsEqual(str1: string | null | undefined, str2: string | null | undefined): boolean {
  if (!str1 || !str2) return false;
  return str1.trim().toLowerCase() === str2.trim().toLowerCase();
}

export async function addComment(workId: number, content: string, mentionedUserIds: string[] = [], attachmentUrls: string[] = []) {
  const { client: supabase, admin: admin } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return { error: "Authentication required." }; }
  if ((!content || content.trim() === '') && attachmentUrls.length === 0) { return { error: "Comment cannot be empty." }; }

  const { data: profile } = await admin.from("profiles").select("full_name").eq("id", user.id).single();
  const userDisplayName = profile?.full_name || user.email || 'A user';

  const { data: commentData, error } = await admin.from("comments").insert({
    work_id: workId,
    user_id: user.id,
    user_full_name: userDisplayName,
    content: content
  }).select().single();

  if (error) {
    console.error("Error posting comment:", error);
    return { error: `Could not post comment: ${error.message}` };
  }

  // Create attachments for the comment if any attachment URLs are provided
  if (attachmentUrls.length > 0) {
    const attachmentPromises = attachmentUrls.map(async (url) => {
      // Extract file name from URL (assuming the URL contains the filename)
      const fileName = url.split('/').pop() || 'attached_file';

      // Determine attachment type based on file type
      let attachmentType = 'general';
      if (fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
        attachmentType = 'site_photo';
      } else if (fileName.match(/\.(pdf)$/i)) {
        attachmentType = 'document';
      } else if (fileName.match(/\.(doc|docx)$/i)) {
        attachmentType = 'document';
      } else if (fileName.match(/\.(txt)$/i)) {
        attachmentType = 'document';
      }

      return admin.from("attachments").insert({
        work_id: workId,
        file_url: url,
        file_name: fileName,
        uploader_id: user.id,
        uploader_full_name: userDisplayName,
        attachment_type: attachmentType,
        comment_id: commentData.id
      });
    });

    // Wait for all attachments to be created
    const attachmentResults = await Promise.all(attachmentPromises);

    // Check if any attachment creation failed
    const failedAttachments = attachmentResults.filter(result => result.error);
    if (failedAttachments.length > 0) {
      console.error("Some attachments failed to create:", failedAttachments);
      // Don't fail the whole comment creation, just log the error
    }
  }

  // Get the work details to determine hierarchy
  const { data: work } = await admin
    .from("works")
    .select("civil_zone, civil_circle, civil_division, civil_sub_division, work_name, je_name")
    .eq("id", workId)
    .single();

  // Get all users who should get hierarchy notifications for this work
  if (work) {
    const hierarchyNotifications: any[] = [];
    const mentionNotifications: any[] = [];

    // Get ALL users who should receive notifications based on work hierarchy
    // This is broader than just the users who can see the work on their dashboard
    // TEMPORARY: Fetch ALL users first to debug
    const { data: allUsersTest, error: allUsersTestError } = await admin
      .from("profiles")
      .select("id, full_name, role, region, circle, division, subdivision");

    console.log(`[addComment] TEST - Fetched ${allUsersTest?.length || 0} users WITHOUT filter`);
    if (allUsersTestError) {
      console.error(`[addComment] TEST - Error:`, allUsersTestError);
    }

    // Now fetch with filter
    const { data: allUsers, error: allUsersError } = await admin
      .from("profiles")
      .select("id, full_name, role, region, circle, division, subdivision")
      .neq("id", user.id); // Exclude the commenter themselves

    console.log(`[addComment] Fetched ${allUsers?.length || 0} users for notification check (excluding commenter ${user.id})`);
    if (allUsersError) {
      console.error(`[addComment] Error fetching users:`, allUsersError);
    }
    console.log(`[addComment] Work details:`, {
      id: work.id,
      work_name: work.work_name,
      je_name: work.je_name,
      civil_sub_division: work.civil_sub_division,
      civil_division: work.civil_division,
      civil_circle: work.civil_circle,
      civil_zone: work.civil_zone
    });

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
            console.log(`Checking JE ${full_name}: region '${region}' vs work.je_name '${work.je_name}'`);
            shouldNotify = areStringsEqual(region, work.je_name);
            break;
          case 'sub_division_head':
            // Sub-division head gets notification if their subdivision matches work's subdivision
            console.log(`Checking SDO ${full_name}: subdivision '${subdivision}' vs work.civil_sub_division '${work.civil_sub_division}'`);
            shouldNotify = areStringsEqual(subdivision, work.civil_sub_division);
            break;
          case 'division_head':
            // Division head gets notification if their division matches work's division
            console.log(`Checking EE ${full_name}: division '${division}' vs work.civil_division '${work.civil_division}'`);
            shouldNotify = areStringsEqual(division, work.civil_division);
            break;
          case 'circle_head':
            // Circle head gets notification if their circle matches work's circle
            console.log(`Checking SE ${full_name}: circle '${circle}' vs work.civil_circle '${work.civil_circle}'`);
            shouldNotify = areStringsEqual(circle, work.civil_circle);
            break;
          case 'zone_head':
            // Zone head gets notification if their zone matches work's zone
            console.log(`Checking CE ${full_name}: zone '${region}' vs work.civil_zone '${work.civil_zone}'`);
            shouldNotify = areStringsEqual(region, work.civil_zone);
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
      const { error: hierarchyError } = await admin.from("notifications").insert(hierarchyNotifications);
      if (hierarchyError) {
        console.error("Error creating hierarchy notifications:", hierarchyError);
      }
    }

    // Insert mention notifications (higher priority)
    if (mentionNotifications.length > 0) {
      const { error: mentionError } = await admin.from("notifications").insert(mentionNotifications);
      if (mentionError) {
        console.error("Error creating mention notifications:", mentionError);
      }
    }
  }

  revalidatePath(`/dashboard/work/${workId}`);
  return { success: true, commentId: commentData.id };
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
  const { client: supabase, admin: adminSupabase } = await createSupabaseServerClient();
  const workId = Number(formData.get('workId'));
  const mbStatus = (formData.get('mbStatus') as string) || (formData.get('mb_status') as string) || null;
  const tecoStatus = (formData.get('tecoStatus') as string) || (formData.get('teco_status') as string) || null;
  const ficoStatus = (formData.get('ficoStatus') as string) || (formData.get('fico_status') as string) || null;

  // Also handle other editable fields from EditableDetailRow
  const civilZone = formData.get('civil_zone') as string | null;
  const civilCircle = formData.get('civil_circle') as string | null;
  const civilDivision = formData.get('civil_division') as string | null;
  const civilSubDivision = formData.get('civil_sub_division') as string | null;
  const districtName = formData.get('district_name') as string | null;
  const jeName = formData.get('je_name') as string | null;
  const workCategory = formData.get('work_category') as string | null;
  const wbsCode = formData.get('wbs_code') as string | null;
  const siteName = formData.get('site_name') as string | null;
  const startDate = formData.get('start_date') as string | null;
  const scheduledCompletionDate = formData.get('scheduled_completion_date') as string | null;
  const sanctionAmountLacs = formData.get('sanction_amount_lacs') as string | null;
  const agreementAmount = formData.get('agreement_amount') as string | null;
  const boqAmount = formData.get('boq_amount') as string | null;
  const tenderNo = formData.get('tender_no') as string | null;
  const nitDate = formData.get('nit_date') as string | null;
  const loiNoAndDate = formData.get('loi_no_and_date') as string | null;
  const part2OpeningDate = formData.get('part2_opening_date') as string | null;
  const agreementNoAndDate = formData.get('agreement_no_and_date') as string | null;
  const weightage = formData.get('weightage') as string | null;
  const rateAsPerAg = formData.get('rate_as_per_ag') as string | null;
  const firmNameAndContact = formData.get('firm_name_and_contact') as string | null;
  const firmContactNo = formData.get('firm_contact_no') as string | null;
  const firmEmail = formData.get('firm_email') as string | null;
  const distributionZone = formData.get('distribution_zone') as string | null;
  const distributionCircle = formData.get('distribution_circle') as string | null;
  const distributionDivision = formData.get('distribution_division') as string | null;
  const distributionSubDivision = formData.get('distribution_sub_division') as string | null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !workId) return { error: 'Authentication or workId missing.' };

  // Fetch current values for audit logging
  const { data: currentWork } = await adminSupabase.from('works').select('*').eq('id', workId).single();

  // Build update object with only provided fields
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (mbStatus !== null) updateData.mb_status = mbStatus;
  if (tecoStatus !== null) updateData.teco_status = tecoStatus;
  if (ficoStatus !== null) updateData.fico_status = ficoStatus;
  if (civilZone !== null) updateData.civil_zone = civilZone;
  if (civilCircle !== null) updateData.civil_circle = civilCircle;
  if (civilDivision !== null) updateData.civil_division = civilDivision;
  if (civilSubDivision !== null) updateData.civil_sub_division = civilSubDivision;
  if (districtName !== null) updateData.district_name = districtName;
  if (jeName !== null) updateData.je_name = jeName;
  if (workCategory !== null) updateData.work_category = workCategory;
  if (wbsCode !== null) updateData.wbs_code = wbsCode;
  if (siteName !== null) updateData.site_name = siteName;
  if (startDate !== null) updateData.start_date = startDate;
  if (scheduledCompletionDate !== null) updateData.scheduled_completion_date = scheduledCompletionDate;
  if (sanctionAmountLacs !== null) updateData.sanction_amount_lacs = sanctionAmountLacs ? parseFloat(sanctionAmountLacs) : null;
  if (agreementAmount !== null) updateData.agreement_amount = agreementAmount ? parseFloat(agreementAmount) : null;
  if (boqAmount !== null) updateData.boq_amount = boqAmount ? parseFloat(boqAmount) : null;
  if (tenderNo !== null) updateData.tender_no = tenderNo;
  if (nitDate !== null) updateData.nit_date = nitDate;
  if (loiNoAndDate !== null) updateData.loi_no_and_date = loiNoAndDate;
  if (part2OpeningDate !== null) updateData.part2_opening_date = part2OpeningDate;
  if (agreementNoAndDate !== null) updateData.agreement_no_and_date = agreementNoAndDate;
  if (weightage !== null) updateData.weightage = weightage ? parseInt(weightage) : null;
  if (rateAsPerAg !== null) updateData.rate_as_per_ag = rateAsPerAg;
  if (firmNameAndContact !== null) updateData.firm_name_and_contact = firmNameAndContact;
  if (firmContactNo !== null) updateData.firm_contact_no = firmContactNo;
  if (firmEmail !== null) updateData.firm_email = firmEmail;
  if (distributionZone !== null) updateData.distribution_zone = distributionZone;
  if (distributionCircle !== null) updateData.distribution_circle = distributionCircle;
  if (distributionDivision !== null) updateData.distribution_division = distributionDivision;
  if (distributionSubDivision !== null) updateData.distribution_sub_division = distributionSubDivision;

  console.log('=== UPDATE WORK STATUSES ===');
  console.log('Work ID:', workId);
  console.log('Update Data:', updateData);

  // Use admin client to bypass RLS
  const { error } = await adminSupabase.from('works').update(updateData).eq('id', workId);

  if (error) {
    console.error('Update error:', error);
    return { error: `Could not update status: ${error.message}` };
  }

  console.log('Update successful');

  // Sync to Google Sheets if scheme_sr_no exists
  if (currentWork?.scheme_sr_no) {
    console.log('=== GOOGLE SHEETS SYNC START ===');
    console.log('Scheme Sr No:', currentWork.scheme_sr_no);
    console.log('Data to sync:', updateData);
    try {
      const syncResult = await pushToGoogleSheet({
        scheme_sr_no: currentWork.scheme_sr_no,
        ...updateData
      });
      console.log('Google Sheets sync result:', syncResult);
      console.log('=== GOOGLE SHEETS SYNC END ===');
    } catch (syncError) {
      console.error('=== GOOGLE SHEETS SYNC ERROR ===');
      console.error('Error details:', syncError);
      console.error('Error message:', syncError instanceof Error ? syncError.message : 'Unknown error');
      console.error('Error stack:', syncError instanceof Error ? syncError.stack : 'No stack trace');
    }
  } else {
    console.warn('=== GOOGLE SHEETS SYNC SKIPPED ===');
    console.warn('Reason: No scheme_sr_no found');
    console.warn('Current work data:', currentWork);
  }

  // Insert an audit comment summarizing status changes (user-facing log)
  try {
    const changes: string[] = [];
    if (currentWork) {
      if (mbStatus !== null && (currentWork.mb_status || '') !== (mbStatus || ''))
        changes.push(`MB Status: "${currentWork.mb_status || 'Not set'}" → "${mbStatus || 'Not set'}"`);
      if (tecoStatus !== null && (currentWork.teco_status || '') !== (tecoStatus || ''))
        changes.push(`TECO Status: "${currentWork.teco_status || 'Not set'}" → "${tecoStatus || 'Not set'}"`);
      if (ficoStatus !== null && (currentWork.fico_status || '') !== (ficoStatus || ''))
        changes.push(`FICO Status: "${currentWork.fico_status || 'Not set'}" → "${ficoStatus || 'Not set'}"`);
      if (civilZone !== null && (currentWork.civil_zone || '') !== (civilZone || ''))
        changes.push(`Civil Zone: "${currentWork.civil_zone || 'Not set'}" → "${civilZone || 'Not set'}"`);
      if (civilCircle !== null && (currentWork.civil_circle || '') !== (civilCircle || ''))
        changes.push(`Civil Circle: "${currentWork.civil_circle || 'Not set'}" → "${civilCircle || 'Not set'}"`);
      if (civilDivision !== null && (currentWork.civil_division || '') !== (civilDivision || ''))
        changes.push(`Civil Division: "${currentWork.civil_division || 'Not set'}" → "${civilDivision || 'Not set'}"`);
      if (civilSubDivision !== null && (currentWork.civil_sub_division || '') !== (civilSubDivision || ''))
        changes.push(`Civil Sub-Division: "${currentWork.civil_sub_division || 'Not set'}" → "${civilSubDivision || 'Not set'}"`);
      if (districtName !== null && (currentWork.district_name || '') !== (districtName || ''))
        changes.push(`District: "${currentWork.district_name || 'Not set'}" → "${districtName || 'Not set'}"`);
      if (jeName !== null && (currentWork.je_name || '') !== (jeName || ''))
        changes.push(`JE Name: "${currentWork.je_name || 'Not set'}" → "${jeName || 'Not set'}"`);
      if (workCategory !== null && (currentWork.work_category || '') !== (workCategory || ''))
        changes.push(`Work Category: "${currentWork.work_category || 'Not set'}" → "${workCategory || 'Not set'}"`);
      if (wbsCode !== null && (currentWork.wbs_code || '') !== (wbsCode || ''))
        changes.push(`WBS Code: "${currentWork.wbs_code || 'Not set'}" → "${wbsCode || 'Not set'}"`);
      if (siteName !== null && (currentWork.site_name || '') !== (siteName || ''))
        changes.push(`Site Name: "${currentWork.site_name || 'Not set'}" → "${siteName || 'Not set'}"`);
      if (startDate !== null && (currentWork.start_date || '') !== (startDate || ''))
        changes.push(`Start Date: "${currentWork.start_date || 'Not set'}" → "${startDate || 'Not set'}"`);
      if (scheduledCompletionDate !== null && (currentWork.scheduled_completion_date || '') !== (scheduledCompletionDate || ''))
        changes.push(`Scheduled Completion: "${currentWork.scheduled_completion_date || 'Not set'}" → "${scheduledCompletionDate || 'Not set'}"`);
      if (sanctionAmountLacs !== null && String(currentWork.sanction_amount_lacs || '') !== String(sanctionAmountLacs || ''))
        changes.push(`Sanction Amount: "${currentWork.sanction_amount_lacs || 'Not set'}" → "${sanctionAmountLacs || 'Not set'}"`);
      if (agreementAmount !== null && String(currentWork.agreement_amount || '') !== String(agreementAmount || ''))
        changes.push(`Agreement Amount: "${currentWork.agreement_amount || 'Not set'}" → "${agreementAmount || 'Not set'}"`);
      if (boqAmount !== null && String(currentWork.boq_amount || '') !== String(boqAmount || ''))
        changes.push(`BOQ Amount: "${currentWork.boq_amount || 'Not set'}" → "${boqAmount || 'Not set'}"`);
      if (tenderNo !== null && (currentWork.tender_no || '') !== (tenderNo || ''))
        changes.push(`Tender No: "${currentWork.tender_no || 'Not set'}" → "${tenderNo || 'Not set'}"`);
      if (nitDate !== null && (currentWork.nit_date || '') !== (nitDate || ''))
        changes.push(`NIT Date: "${currentWork.nit_date || 'Not set'}" → "${nitDate || 'Not set'}"`);
      if (loiNoAndDate !== null && (currentWork.loi_no_and_date || '') !== (loiNoAndDate || ''))
        changes.push(`LOI No & Date: "${currentWork.loi_no_and_date || 'Not set'}" → "${loiNoAndDate || 'Not set'}"`);
      if (part2OpeningDate !== null && (currentWork.part2_opening_date || '') !== (part2OpeningDate || ''))
        changes.push(`Part 2 Opening: "${currentWork.part2_opening_date || 'Not set'}" → "${part2OpeningDate || 'Not set'}"`);
      if (agreementNoAndDate !== null && (currentWork.agreement_no_and_date || '') !== (agreementNoAndDate || ''))
        changes.push(`Agreement No & Date: "${currentWork.agreement_no_and_date || 'Not set'}" → "${agreementNoAndDate || 'Not set'}"`);
      if (weightage !== null && String(currentWork.weightage || '') !== String(weightage || ''))
        changes.push(`Weightage: "${currentWork.weightage || 'Not set'}" → "${weightage || 'Not set'}"`);
      if (rateAsPerAg !== null && (currentWork.rate_as_per_ag || '') !== (rateAsPerAg || ''))
        changes.push(`Rate as per Ag: "${currentWork.rate_as_per_ag || 'Not set'}" → "${rateAsPerAg || 'Not set'}"`);
      if (firmNameAndContact !== null && (currentWork.firm_name_and_contact || '') !== (firmNameAndContact || ''))
        changes.push(`Firm Name: "${currentWork.firm_name_and_contact || 'Not set'}" → "${firmNameAndContact || 'Not set'}"`);
      if (firmContactNo !== null && (currentWork.firm_contact_no || '') !== (firmContactNo || ''))
        changes.push(`Firm Contact: "${currentWork.firm_contact_no || 'Not set'}" → "${firmContactNo || 'Not set'}"`);
      if (firmEmail !== null && (currentWork.firm_email || '') !== (firmEmail || ''))
        changes.push(`Firm Email: "${currentWork.firm_email || 'Not set'}" → "${firmEmail || 'Not set'}"`);
      if (distributionZone !== null && (currentWork.distribution_zone || '') !== (distributionZone || ''))
        changes.push(`Dist Zone: "${currentWork.distribution_zone || 'Not set'}" → "${distributionZone || 'Not set'}"`);
      if (distributionCircle !== null && (currentWork.distribution_circle || '') !== (distributionCircle || ''))
        changes.push(`Dist Circle: "${currentWork.distribution_circle || 'Not set'}" → "${distributionCircle || 'Not set'}"`);
      if (distributionDivision !== null && (currentWork.distribution_division || '') !== (distributionDivision || ''))
        changes.push(`Dist Division: "${currentWork.distribution_division || 'Not set'}" → "${distributionDivision || 'Not set'}"`);
    }

    if (changes.length > 0) {
      const changeText = `Updated by ${user.email}: ` + changes.join('; ');
      await adminSupabase.from('comments').insert({
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

  return { success: 'Updated successfully.' };
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
  const { admin: admin, client: supabase } = await createSupabaseServerClient();
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
  const { data: profile } = await admin.from("profiles").select("full_name").eq("id", user.id).single();
  const displayName = profile?.full_name || user.email || 'Unknown User';

  // Insert a new payment log
  const { error: paymentLogError } = await admin.from("payment_logs").insert({
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
  const { admin: admin } = await createSupabaseServerClient();

  const { data } = await admin
    .from('works')
    .select(fieldName)
    .not(fieldName, 'is', null)
    .limit(100);

  if (!data) return [];

  const uniqueValues = [...new Set(data.map((row: any) => row[fieldName]).filter(Boolean))];
  return uniqueValues.sort();
}

export async function fetchWorkDetails(workId: number) {
  const { client: supabase, admin: admin } = await createSupabaseServerClient();

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
  const usersPromise = admin.from("profiles").select('id, full_name');

  // Fetch current user's profile
  const profilePromise = supabase.from("profiles").select('role').eq('id', user.id).single();

  // Fetch progress logs with user names
  const progressLogsPromise = admin
    .from("progress_logs")
    .select(
      `id, work_id, user_id, user_email, user_full_name, previous_progress, new_progress, remark, created_at`
    )
    .eq('work_id', workId)
    .order('created_at', { ascending: false });

  // Fetch attachments for ProgressPhotosSection (all attachments for this work)
  const allAttachmentsPromise = admin
    .from("attachments")
    .select('id, file_url, file_name, created_at, attachment_type, uploader_id, uploader_full_name')
    .eq('work_id', workId);

  // Fetch attachments linked to progress logs separately
  const progressAttachmentsPromise = admin
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

  // Fetch attachments linked to comments
  const commentAttachmentsPromise = admin
    .from("attachments")
    .select('id, file_url, file_name, created_at, attachment_type, comment_id')
    .eq('work_id', workId)
    .not('comment_id', 'is', null);

  // Fetch payment logs
  const paymentLogsPromise = supabase
    .from('payment_logs')
    .select('id, work_id, user_id, created_at, user_email, previous_bill_no, previous_bill_amount, new_bill_no, new_bill_amount, remark')
    .eq('work_id', workId)
    .order('created_at', { ascending: false });

  const [
    { data: workRow, error: workError },
    { data: allUsers, error: allUsersError },
    { data: currentUserProfile },
    { data: progressLogs },
    { data: allAttachments },
    { data: progressAttachments },
    { data: paymentLogs },
    { data: comments },
    { data: commentAttachments }
  ] = await Promise.all([workPromise, usersPromise, profilePromise, progressLogsPromise, allAttachmentsPromise, progressAttachmentsPromise, paymentLogsPromise, commentsPromise, commentAttachmentsPromise]);

  console.log('All users query result:', { allUsers: allUsers?.length || 0, allUsersError });

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
  const commentAttachmentsData = (commentAttachments || []) as any[];

  // Link attachments to comments
  const commentsWithAttachments = (comments || []).map((comment: any) => ({
    ...comment,
    attachments: commentAttachmentsData.filter(att => att.comment_id === comment.id)
  }));

  // Link attachments to progress logs
  const progressLogsWithAttachments = progressLogsData.map(log => ({
    ...log,
    attachments: progressAttachmentsData.filter(att => att.progress_log_id === log.id)
  }));

  // Build mention users list - include all users
  const usersForMentions = allUsersData && allUsersData.length > 0 ? allUsersData
    .filter(u => u.id !== user.id) // Exclude current user
    .map(u => ({ id: u.id, display: u.full_name || 'Unknown User' })) // Use full_name
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
    comments: commentsWithAttachments || [],
    allAttachments: allAttachments || []
  };
}
