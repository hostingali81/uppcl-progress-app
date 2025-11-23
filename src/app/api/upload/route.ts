// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSettings } from "@/app/(main)/admin/settings/actions";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    console.log("API route: Upload request received");

    const { client: supabase, admin: supabaseAdmin } = await createSupabaseServerClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const fileData = formData.get("file");
    const workIdStr = (formData.get("workId") as string) || '0';
    const attachmentType = (formData.get("attachmentType") as string) || 'comment_attachment';
    const progressLogIdStr = formData.get("progress_log_id") as string;
    const progressLogId = progressLogIdStr ? parseInt(progressLogIdStr) : null;
    const commentIdStr = formData.get("comment_id") as string;
    const commentId = commentIdStr ? parseInt(commentIdStr) : null;

    console.log("File data received:", {
      fileDataType: typeof fileData,
      fileDataConstructor: (fileData as any)?.constructor?.name,
      isFile: (fileData as any) instanceof File,
      isBlob: (fileData as any) instanceof Blob,
      fileName: (fileData as any)?.name,
      fileType: (fileData as any)?.type,
      fileSize: (fileData as any)?.size,
      workIdStr,
      attachmentType,
      isCommentAttachment: workIdStr === '0' || !workIdStr
    });

    if (!fileData) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Handle comment attachments (workId === '0' or workIdStr is not provided)
    const isCommentAttachment = workIdStr === '0' || !workIdStr;
    let workId: number | null = null;

    if (!isCommentAttachment) {
      if (!workIdStr) {
        return NextResponse.json({ error: "workId is required for work attachments" }, { status: 400 });
      }
      workId = parseInt(workIdStr);
      if (isNaN(workId) || workId <= 0) {
        return NextResponse.json({ error: "Invalid workId" }, { status: 400 });
      }
    }

    // Handle the file data properly
    let fileBlob: Blob;
    let fileName: string;
    let fileType: string;

    if ((fileData as any) instanceof File) {
      fileBlob = fileData as File;
      fileName = (fileData as File).name;
      fileType = (fileData as File).type;
    } else if ((fileData as any) instanceof Blob) {
      fileBlob = fileData as Blob;
      fileName = `uploaded-file-${Date.now()}`;
      fileType = (fileData as Blob).type || 'application/octet-stream';
    } else if (typeof fileData === 'string') {
      // Handle as string (might be base64 or something)
      return NextResponse.json({ error: "String file data not supported" }, { status: 400 });
    } else {
      console.log("File data details:", fileData);
      return NextResponse.json({ error: "Invalid file format - not File, Blob, or string" }, { status: 400 });
    }

    const settings = await getSettings(supabase);
    const accountId = settings.cloudflare_account_id;
    const accessKeyId = settings.cloudflare_access_key_id;
    const secretAccessKey = settings.cloudflare_secret_access_key;
    const bucketName = settings.cloudflare_r2_bucket_name;
    const publicUrl = settings.cloudflare_public_r2_url;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
      return NextResponse.json({ error: "Cloudflare R2 settings are not configured" }, { status: 500 });
    }

    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    const uniqueKey = `uploads/${crypto.randomUUID()}-${fileName}`;
    const publicFileUrl = `${publicUrl}/${uniqueKey}`;

    // Convert file to buffer
    const buffer = Buffer.from(await fileBlob.arrayBuffer());

    console.log("Uploading file to R2:", { key: uniqueKey, size: buffer.length });

    const uploadResponse = await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueKey,
        ContentType: fileType,
        Body: buffer,
      })
    );

    console.log("File upload to R2 successful:", uploadResponse);

    // Get user profile for upload logging
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

    // Save attachment record based on type - USE SUPABASEADMIN TO BYPASS RLS
    const attachmentData = {
      file_url: publicFileUrl,
      file_name: fileName,
      uploader_id: user.id,
      uploader_full_name: profile?.full_name || user.email,
      attachment_type: attachmentType,
      progress_log_id: progressLogId || null,
      comment_id: commentId || null
    };

    // Add work_id only for non-comment attachments
    if (!isCommentAttachment && workId) {
      (attachmentData as any).work_id = workId;
    }

    console.log("Inserting attachment data:", attachmentData);

    // Use supabaseAdmin to bypass RLS for database operations
    const { error: attachError } = await supabaseAdmin.from("attachments").insert(attachmentData);

    if (attachError) {
      console.error("Failed to save attachment record:", attachError);
      return NextResponse.json({ error: `Upload successful but database save failed: ${attachError.message}` }, { status: 500 });
    }

    console.log("Upload and DB save successful");

    // CREATE FILE UPLOAD NOTIFICATIONS (Only for direct work attachments, not comment attachments)
    if (!isCommentAttachment && workId) {
      console.log(`📂 File uploaded to work ${workId} - Creating notifications...`);

      try {
        // Fetch work details for hierarchy check
        const { data: workDetails } = await supabaseAdmin
          .from("works")
          .select("work_name, je_name, civil_sub_division, civil_division, civil_circle, civil_zone")
          .eq("id", workId)
          .single();

        if (workDetails) {
          // Get notification settings
          let prefs = {};
          try {
            const settingsData = await getSettings(supabaseAdmin);
            prefs = JSON.parse(settingsData.notification_preferences || '{}');
          } catch (e) {
            console.error("Error parsing notification preferences:", e);
            prefs = {};
          }

          // Fetch all users who should be notified
          const { data: allUsers } = await supabaseAdmin
            .from("profiles")
            .select("id, full_name, role, region, circle, division, subdivision")
            .neq("id", user.id); // Exclude uploader

          if (allUsers && allUsers.length > 0) {
            const uploadNotifications: any[] = [];

            for (const userProfile of allUsers) {
              const { id, full_name, role, region, circle, division, subdivision } = userProfile;
              let shouldNotify = false;

              // Normalize role
              const normalizedRole = role?.toLowerCase() || '';

              // Check hierarchy
              switch (normalizedRole) {
                case 'superadmin':
                case 'admin':
                  shouldNotify = true;
                  break;
                case 'je':
                  shouldNotify = region === workDetails.je_name;
                  break;
                case 'sub_division_head':
                  shouldNotify = subdivision === workDetails.civil_sub_division;
                  break;
                case 'division_head':
                  shouldNotify = division === workDetails.civil_division;
                  break;
                case 'circle_head':
                  shouldNotify = circle === workDetails.civil_circle;
                  break;
                case 'zone_head':
                  shouldNotify = region === workDetails.civil_zone;
                  break;
              }

              // Check file_uploads preference
              if (shouldNotify) {
                const rolePrefs = prefs[normalizedRole] || {};
                if (rolePrefs.file_uploads !== false) {
                  uploadNotifications.push({
                    user_id: id,
                    work_id: workId,
                    type: 'file_upload',
                    message: `${profile?.full_name || user.email} uploaded a file "${fileName}" to "${workDetails.work_name}"`,
                    created_by: user.id
                  });
                }
              }
            }

            // Insert notifications
            if (uploadNotifications.length > 0) {
              const { error: notifError } = await supabaseAdmin
                .from("notifications")
                .insert(uploadNotifications);

              if (notifError) {
                console.error("Error creating upload notifications:", notifError);
              } else {
                console.log(`✅ Created ${uploadNotifications.length} file upload notifications`);
              }
            }
          }
        }
      } catch (notifError) {
        console.error("Error in upload notification creation:", notifError);
      }
    }

    // Revalidate the work page to show the new attachment
    if (workId) {
      revalidatePath(`/dashboard/work/${workId}`);
    }
    revalidatePath('/dashboard');

    return NextResponse.json({
      publicFileUrl,
      url: publicFileUrl, // For backward compatibility
      fileName: fileName
    });
  } catch (error: unknown) {
    console.error("Upload API route error:", error);
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
