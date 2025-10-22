// src/app/(main)/dashboard/work/[id]/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { google } from "googleapis";
import { getSettings } from "@/app/(main)/admin/settings/actions";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

// ====================================================================
// ये फंक्शन अपरिवर्तित हैं
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

async function updateGoogleSheet(workSrNo: string, newProgress: number, newRemark: string) {
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
        console.log(`Google Sheet updated for Sr. No. ${workSrNo}`);
    } catch (error: any) {
        console.error("CRITICAL: Failed to update Google Sheet:", error.message);
    }
}

export async function updateWorkProgress(formData: FormData) {
    const { admin: supabaseAdmin, client: supabaseUserClient } = await createSupabaseServerClient();
    const workId = formData.get("workId") as string;
    const progress = formData.get("progress") as string;
    const remark = formData.get("remark") as string;
    const { data: { user } } = await supabaseUserClient.auth.getUser();
    if (!workId || !user) return { error: "Work ID or User is missing." };
    const { data: currentWork, error: fetchError } = await supabaseUserClient.from("works").select("progress_percentage, scheme_sr_no").eq("id", workId).single();
    if (fetchError || !currentWork) return { error: "Could not fetch current work details." };
    const { error: updateError } = await supabaseUserClient.from("works").update({ progress_percentage: parseInt(progress, 10), remark: remark }).eq("id", workId);
    if (updateError) return { error: `Database Error: ${updateError.message}` };
    await supabaseAdmin.from("progress_logs").insert({ work_id: workId, user_id: user.id, user_email: user.email, previous_progress: currentWork.progress_percentage, new_progress: parseInt(progress, 10), remark: remark });
    if (currentWork.scheme_sr_no) { await updateGoogleSheet(currentWork.scheme_sr_no, parseInt(progress, 10), remark); }
    revalidatePath(`/dashboard/work/${workId}`);
    revalidatePath("/dashboard");
    return { success: "Progress updated and logged successfully!" };
}

export async function generateUploadUrl(fileName: string, fileType: string) {
  try {
    const { client: supabase } = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { return { error: "Authentication required." }; }
    const settings = await getSettings(supabase);
    const accountId = settings.cloudflare_account_id;
    const accessKeyId = settings.cloudflare_access_key_id;
    const secretAccessKey = settings.cloudflare_secret_access_key;
    const bucketName = settings.cloudflare_r2_bucket_name;
    const publicUrl = settings.cloudflare_public_r2_url;
    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) { return { error: "Cloudflare R2 settings are not configured." }; }
    const s3Client = new S3Client({ region: "auto", endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey }, });
    const uniqueKey = `uploads/${crypto.randomUUID()}-${fileName}`;
    const command = new PutObjectCommand({ Bucket: bucketName, Key: uniqueKey, ContentType: fileType });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    const publicFileUrl = `${publicUrl}/${uniqueKey}`;
    return { success: { uploadUrl, publicFileUrl } };
  } catch (error: any) { return { error: `Failed to generate upload URL: ${error.message}` }; }
}

export async function addAttachmentToWork(workId: number, fileUrl: string, fileName: string) {
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return { error: "Authentication required." }; }
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const { error } = await supabase.from("attachments").insert({ work_id: workId, file_url: fileUrl, file_name: fileName, uploader_id: user.id, uploader_full_name: profile?.full_name || user.email });
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
  } catch (r2Error: any) {
    console.error("Failed to delete file from R2:", r2Error.message);
    return { error: "Could not delete file from storage." };
  }
  const { error: deleteError } = await supabase.from("attachments").delete().eq("id", attachmentId);
  if (deleteError) { return { error: `Could not delete attachment from database: ${deleteError.message}` }; }
  revalidatePath(`/(main)/dashboard/work/${workId}`);
  return { success: "File deleted successfully." };
}

export async function addComment(workId: number, content: string) {
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return { error: "Authentication required." }; }
  if (!content || content.trim() === '') { return { error: "Comment cannot be empty." }; }
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const { error } = await supabase.from("comments").insert({ work_id: workId, user_id: user.id, user_full_name: profile?.full_name || user.email, content: content });
  if (error) { return { error: `Could not post comment: ${error.message}` }; }
  revalidatePath(`/(main)/dashboard/work/${workId}`);
  return { success: "Comment posted." };
}

export async function editComment(commentId: number, newContent: string) {
  const { client: supabase } = await createSupabaseServerClient();
  if (!newContent || newContent.trim() === '') { return { error: "Comment cannot be empty." }; }
  const { error } = await supabase.from("comments").update({ content: newContent, is_edited: true }).eq("id", commentId);
  if (error) { return { error: `Could not update comment: ${error.message}` }; }
  revalidatePath(`/(main)/dashboard/work/[id]`);
  return { success: "Comment updated." };
}

export async function deleteComment(commentId: number) {
  const { client: supabase } = await createSupabaseServerClient();
  const { error } = await supabase.from("comments").update({ content: "यह टिप्पणी हटा दी गई है।", is_deleted: true }).eq("id", commentId);
  if (error) { return { error: `Could not delete comment: ${error.message}` }; }
  revalidatePath(`/(main)/dashboard/work/[id]`);
  return { success: "Comment deleted." };
}

// ====================================================================
// नया कोड यहाँ से शुरू होता है
// ====================================================================

export async function toggleBlockerStatus(
  workId: number,
  status: boolean,
  remark: string | null
) {
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return { error: "Authentication required." }; }

  // RLS नीतियों का सम्मान करते हुए काम को अपडेट करें
  const { error } = await supabase
    .from("works")
    .update({
      is_blocked: status,
      blocker_remark: status ? remark : null // यदि अनब्लॉक कर रहे हैं, तो रिमार्क को हटा दें
    })
    .eq("id", workId);

  if (error) {
    return { error: `Could not update blocker status: ${error.message}` };
  }

  // डैशबोर्ड और वर्क पेज दोनों के कैश को रीफ्रेश करें
  revalidatePath(`/(main)/dashboard/work/${workId}`);
  revalidatePath(`/(main)/dashboard`);
  
  return { success: "Blocker status updated successfully." };
}