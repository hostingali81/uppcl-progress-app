// src/app/api/r2-signed-url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSettings } from '@/app/(main)/admin/settings/actions';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { client: supabase } = await createSupabaseServerClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { fileName, fileType } = await request.json();

        if (!fileName || !fileType) {
            return NextResponse.json(
                { error: 'fileName and fileType are required' },
                { status: 400 }
            );
        }

        // Get Cloudflare R2 settings
        const settings = await getSettings(supabase);
        const accountId = settings.cloudflare_account_id;
        const accessKeyId = settings.cloudflare_access_key_id;
        const secretAccessKey = settings.cloudflare_secret_access_key;
        const bucketName = settings.cloudflare_r2_bucket_name;
        const publicUrl = settings.cloudflare_public_r2_url;

        if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
            return NextResponse.json(
                { error: 'Cloudflare R2 settings are not configured' },
                { status: 500 }
            );
        }

        // Initialize S3 client for R2
        const s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey }
        });

        // Generate unique key for the file
        const uniqueKey = `uploads/${crypto.randomUUID()}-${fileName}`;

        // Create presigned URL for PUT operation
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: uniqueKey,
            ContentType: fileType
        });

        const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600 // 1 hour
        });

        const publicFileUrl = `${publicUrl}/${uniqueKey}`;

        console.log('✅ Generated signed URL for:', fileName);

        return NextResponse.json({
            signedUrl,
            publicFileUrl,
            key: uniqueKey
        });
    } catch (error) {
        console.error('❌ Signed URL generation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate signed URL' },
            { status: 500 }
        );
    }
}
