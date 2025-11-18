import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSettings } from "@/app/(main)/admin/settings/actions";
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
    const workIdStr = formData.get("workId") as string;
    const attachmentType = (formData.get("attachmentType") as string) || 'site_photo';

    console.log("File data received:", {
      fileDataType: typeof fileData,
      fileDataConstructor: (fileData as any)?.constructor?.name,
      isFile: (fileData as any) instanceof File,
      isBlob: (fileData as any) instanceof Blob,
      fileName: (fileData as any)?.name,
      fileType: (fileData as any)?.type,
      fileSize: (fileData as any)?.size
    });

    if (!fileData || !workIdStr) {
      return NextResponse.json({ error: "File and workId are required" }, { status: 400 });
    }

    const workId = parseInt(workIdStr);
    if (isNaN(workId)) {
      return NextResponse.json({ error: "Invalid workId" }, { status: 400 });
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

    const publicFileUrl = `${publicUrl}/${uniqueKey}`;

    // Get user profile for upload logging
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

    // Save attachment record
    const { error: attachError } = await supabase.from("attachments").insert({
      work_id: workId,
      file_url: publicFileUrl,
      file_name: fileName,
      uploader_id: user.id,
      uploader_full_name: profile?.full_name || user.email,
      attachment_type: attachmentType
    });

    if (attachError) {
      console.error("Failed to save attachment record:", attachError);
      return NextResponse.json({ error: `Upload successful but database save failed: ${attachError.message}` }, { status: 500 });
    }

    console.log("Upload and DB save successful");

    return NextResponse.json({
      publicFileUrl,
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
