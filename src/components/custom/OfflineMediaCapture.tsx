// src/components/custom/OfflineMediaCapture.tsx
'use client';

import { useState } from 'react';
import { Camera, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { captureImage, selectFile, createBlobUrl, formatFileSize } from '@/lib/media/capture';
import { createAttachmentOffline } from '@/lib/db/operations';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from 'sonner';

interface OfflineMediaCaptureProps {
    workId: number | string | null;
    progressLogId?: number | string | null;
    commentId?: number | string | null;
    attachmentType: string;
    userId: string;
    userFullName: string;
    onCapture?: (attachment: any) => void;
    className?: string;
}

export function OfflineMediaCapture({
    workId,
    progressLogId,
    commentId,
    attachmentType,
    userId,
    userFullName,
    onCapture,
    className
}: OfflineMediaCaptureProps) {
    const [isCapturing, setIsCapturing] = useState(false);
    const isOnline = useOnlineStatus();

    const handleCapture = async () => {
        setIsCapturing(true);
        try {
            const blob = await captureImage();
            const fileName = `photo_${Date.now()}.jpg`;

            const attachment = await createAttachmentOffline({
                work_id: workId,
                progress_log_id: progressLogId || null,
                comment_id: commentId || null,
                file_name: fileName,
                file_blob: blob,
                uploader_id: userId,
                uploader_full_name: userFullName,
                attachment_type: attachmentType
            });

            const message = isOnline
                ? `Photo captured (${formatFileSize(blob.size)}) - Queued for upload`
                : `Photo saved offline (${formatFileSize(blob.size)}) - Will upload when online`;

            toast.success(message);

            onCapture?.(attachment);
        } catch (error) {
            console.error('Capture error:', error);
            if (error instanceof Error && error.message !== 'No file selected') {
                toast.error('Failed to capture photo');
            }
        } finally {
            setIsCapturing(false);
        }
    };

    const handleFileSelect = async () => {
        setIsCapturing(true);
        try {
            const file = await selectFile();

            const attachment = await createAttachmentOffline({
                work_id: workId,
                progress_log_id: progressLogId || null,
                comment_id: commentId || null,
                file_name: file.name,
                file_blob: file,
                uploader_id: userId,
                uploader_full_name: userFullName,
                attachment_type: attachmentType
            });

            const message = isOnline
                ? `File attached (${formatFileSize(file.size)}) - Queued for upload`
                : `File saved offline (${formatFileSize(file.size)}) - Will upload when online`;

            toast.success(message);

            onCapture?.(attachment);
        } catch (error) {
            console.error('File select error:', error);
            if (error instanceof Error && error.message !== 'No file selected') {
                toast.error('Failed to attach file');
            }
        } finally {
            setIsCapturing(false);
        }
    };

    return (
        <div className={`flex gap-2 ${className || ''}`}>
            <Button
                onClick={handleCapture}
                disabled={isCapturing}
                variant="outline"
                size="sm"
                type="button"
            >
                {isCapturing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Camera className="h-4 w-4" />
                )}
                <span className="ml-2">Take Photo</span>
            </Button>

            <Button
                onClick={handleFileSelect}
                disabled={isCapturing}
                variant="outline"
                size="sm"
                type="button"
            >
                {isCapturing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="h-4 w-4" />
                )}
                <span className="ml-2">Attach File</span>
            </Button>
        </div>
    );
}
