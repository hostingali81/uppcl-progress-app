// src/lib/sync/engine.ts
import { db, SyncQueue } from '../db/schema';
import { createClient } from '../supabase/client';
import {
    updateAttachmentStatus,
    updateAttachmentProgress,
    updateSyncItemStatus,
    incrementSyncAttempts
} from '../db/operations';

export class SyncEngine {
    private isRunning = false;
    private syncInterval: NodeJS.Timeout | null = null;
    private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds

    /**
     * Start the sync engine
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Sync engine already running');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Sync engine started');

        // Run immediately
        await this.processSyncQueue();

        // Then run every 30 seconds
        this.syncInterval = setInterval(() => {
            this.processSyncQueue();
        }, this.SYNC_INTERVAL_MS);
    }

    /**
     * Stop the sync engine
     */
    stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.isRunning = false;
        console.log('🛑 Sync engine stopped');
    }

    /**
     * Process all pending sync items
     */
    async processSyncQueue() {
        if (!navigator.onLine) {
            console.log('📴 Offline - skipping sync');
            return;
        }

        const pendingItems = await db.syncQueue
            .where('status')
            .anyOf(['pending', 'failed'])
            .filter(item => {
                // Retry logic with exponential backoff
                if (!item.nextRetry) return true;
                return new Date(item.nextRetry) <= new Date();
            })
            .toArray();

        if (pendingItems.length === 0) {
            return;
        }

        console.log(`🔄 Processing ${pendingItems.length} sync items`);

        for (const item of pendingItems) {
            await this.processSyncItem(item);
        }
    }

    /**
     * Process a single sync item
     */
    private async processSyncItem(item: SyncQueue) {
        try {
            await updateSyncItemStatus(item.id!, 'processing');

            switch (item.entity) {
                case 'work':
                    await this.syncWork(item);
                    break;
                case 'progress_log':
                    await this.syncProgressLog(item);
                    break;
                case 'attachment':
                    await this.syncAttachment(item);
                    break;
                case 'comment':
                    await this.syncComment(item);
                    break;
            }

            await updateSyncItemStatus(item.id!, 'completed');
            console.log(`✅ Synced ${item.entity} (${item.operation})`);
        } catch (error) {
            console.error(`❌ Sync failed for ${item.entity}:`, error);

            const attempts = item.attempts + 1;
            const maxAttempts = item.maxAttempts || 5;

            if (attempts >= maxAttempts) {
                await updateSyncItemStatus(
                    item.id!,
                    'failed',
                    error instanceof Error ? error.message : 'Unknown error'
                );
            } else {
                // Exponential backoff: 1min, 2min, 4min, 8min, 16min
                const backoffMinutes = Math.pow(2, attempts);
                const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000);

                await incrementSyncAttempts(item.id!, nextRetry);
                await updateSyncItemStatus(
                    item.id!,
                    'pending',
                    error instanceof Error ? error.message : 'Unknown error'
                );
            }
        }
    }

    /**
     * Sync a work item
     */
    private async syncWork(item: SyncQueue) {
        const supabase = createClient();

        if (item.operation === 'create') {
            // Remove sync metadata before inserting
            const { syncStatus, lastSyncAttempt, syncError, tempId, ...workData } = item.payload;

            const { data, error } = await supabase
                .from('works')
                .insert(workData as any)
                .select()
                .single();

            if (error) throw error;

            // Update local record with real ID
            const localWork = await db.works.where('tempId').equals(item.entityId).first();
            if (localWork) {
                await db.works.update(localWork.id!, {
                    id: (data as any).id,
                    syncStatus: 'synced',
                    lastSyncAttempt: new Date().toISOString(),
                    syncError: null
                });

                // Update any related progress logs or attachments with the new work ID
                await this.updateRelatedItemsWorkId(item.entityId, (data as any).id);
            }
        } else if (item.operation === 'update') {
            const { error } = await supabase
                .from('works')
                // @ts-ignore - Type is correct at runtime but Supabase types are too strict
                .update(item.payload.updates as any)
                .eq('id', item.payload.id);

            if (error) throw error;

            await db.works.update(item.payload.id, {
                syncStatus: 'synced',
                lastSyncAttempt: new Date().toISOString(),
                syncError: null
            });
        }
    }

    /**
     * Sync a progress log
     */
    private async syncProgressLog(item: SyncQueue) {
        const supabase = createClient();

        if (item.operation === 'create') {
            // Resolve work_id if it's a tempId
            let workId = item.payload.work_id;
            if (typeof workId === 'string' && workId.startsWith('temp_')) {
                const localWork = await db.works.where('tempId').equals(workId).first();
                if (!localWork?.id) {
                    throw new Error('Parent work not synced yet - will retry');
                }
                workId = localWork.id;
            }

            // Remove sync metadata
            const { syncStatus, lastSyncAttempt, syncError, tempId, ...logData } = item.payload;

            const { data, error } = await supabase
                .from('progress_logs')
                .insert({ ...logData, work_id: workId } as any)
                .select()
                .single();

            if (error) throw error;

            const localLog = await db.progressLogs.where('tempId').equals(item.entityId).first();
            if (localLog) {
                await db.progressLogs.update(localLog.id!, {
                    id: (data as any).id,
                    work_id: workId as any,
                    syncStatus: 'synced',
                    lastSyncAttempt: new Date().toISOString(),
                    syncError: null
                });

                // Update any related attachments with the new progress log ID
                await this.updateRelatedItemsProgressLogId(item.entityId, (data as any).id);
            }
        }
    }

    /**
     * Sync an attachment (upload to R2 and save to database)
     */
    private async syncAttachment(item: SyncQueue) {
        const attachment = await db.attachments.where('tempId').equals(item.entityId).first();
        if (!attachment || !attachment.file_blob) {
            throw new Error('Attachment or blob not found');
        }

        // Update status to uploading
        await updateAttachmentStatus(attachment.id!, 'uploading');

        // Step 1: Get signed URL
        const signedUrlResponse = await fetch('/api/r2-signed-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName: attachment.file_name,
                fileType: attachment.file_blob.type || 'application/octet-stream'
            })
        });

        if (!signedUrlResponse.ok) {
            const errorText = await signedUrlResponse.text();
            throw new Error(`Failed to get signed URL: ${errorText}`);
        }

        const { signedUrl, publicFileUrl } = await signedUrlResponse.json();

        // Step 2: Upload to R2 using signed URL with progress tracking
        const uploadResponse = await this.uploadWithProgress(
            signedUrl,
            attachment.file_blob,
            (progress) => {
                updateAttachmentProgress(attachment.id!, progress);
            }
        );

        if (!uploadResponse.ok) {
            throw new Error(`Failed to upload to R2: ${uploadResponse.statusText}`);
        }

        await updateAttachmentProgress(attachment.id!, 100);

        // Step 3: Resolve IDs if they're tempIds
        let workId = attachment.work_id;
        let progressLogId = attachment.progress_log_id;
        let commentId = attachment.comment_id;

        if (typeof workId === 'string' && workId.startsWith('temp_')) {
            const localWork = await db.works.where('tempId').equals(workId).first();
            workId = localWork?.id || null;
        }

        if (typeof progressLogId === 'string' && progressLogId.startsWith('temp_')) {
            const localLog = await db.progressLogs.where('tempId').equals(progressLogId).first();
            progressLogId = localLog?.id || null;
        }

        if (typeof commentId === 'string' && commentId.startsWith('temp_')) {
            const localComment = await db.comments.where('tempId').equals(commentId).first();
            commentId = localComment?.id || null;
        }

        // Step 4: Save attachment record to Supabase
        const supabase = createClient();

        const { data, error } = await supabase
            .from('attachments')
            .insert({
                work_id: workId,
                progress_log_id: progressLogId,
                comment_id: commentId,
                file_name: attachment.file_name,
                file_url: publicFileUrl,
                uploader_id: attachment.uploader_id,
                uploader_full_name: attachment.uploader_full_name,
                attachment_type: attachment.attachment_type
            } as any)
            .select()
            .single();

        if (error) throw error;

        await updateAttachmentStatus(attachment.id!, 'uploaded', publicFileUrl);

        // Update the attachment with the real ID
        await db.attachments.update(attachment.id!, {
            id: (data as any).id,
            file_url: publicFileUrl
        });
    }

    /**
     * Sync a comment
     */
    private async syncComment(item: SyncQueue) {
        const supabase = createClient();

        if (item.operation === 'create') {
            // Resolve work_id if it's a tempId
            let workId = item.payload.work_id;
            if (typeof workId === 'string' && workId.startsWith('temp_')) {
                const localWork = await db.works.where('tempId').equals(workId).first();
                if (!localWork?.id) {
                    throw new Error('Parent work not synced yet - will retry');
                }
                workId = localWork.id;
            }

            // Remove sync metadata
            const { syncStatus, lastSyncAttempt, syncError, tempId, ...commentData } = item.payload;

            const { data, error } = await supabase
                .from('comments')
                .insert({ ...commentData, work_id: workId } as any)
                .select()
                .single();

            if (error) throw error;

            const localComment = await db.comments.where('tempId').equals(item.entityId).first();
            if (localComment) {
                await db.comments.update(localComment.id!, {
                    id: (data as any).id,
                    work_id: workId as any,
                    syncStatus: 'synced',
                    lastSyncAttempt: new Date().toISOString(),
                    syncError: null
                });
            }
        }
    }

    /**
     * Upload with progress tracking
     */
    private async uploadWithProgress(
        url: string,
        blob: Blob,
        onProgress: (progress: number) => void
    ): Promise<Response> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    onProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(new Response(xhr.response, {
                        status: xhr.status,
                        statusText: xhr.statusText
                    }));
                } else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('PUT', url);
            xhr.setRequestHeader('Content-Type', blob.type || 'application/octet-stream');
            xhr.send(blob);
        });
    }

    /**
     * Update related items when a work gets a real ID
     */
    private async updateRelatedItemsWorkId(tempWorkId: string, realWorkId: number) {
        // Update progress logs
        const logs = await db.progressLogs.where('work_id').equals(tempWorkId).toArray();
        for (const log of logs) {
            await db.progressLogs.update(log.id!, { work_id: realWorkId });
        }

        // Update attachments
        const attachments = await db.attachments.where('work_id').equals(tempWorkId).toArray();
        for (const attachment of attachments) {
            await db.attachments.update(attachment.id!, { work_id: realWorkId });
        }

        // Update comments
        const comments = await db.comments.where('work_id').equals(tempWorkId).toArray();
        for (const comment of comments) {
            await db.comments.update(comment.id!, { work_id: realWorkId });
        }
    }

    /**
     * Update related attachments when a progress log gets a real ID
     */
    private async updateRelatedItemsProgressLogId(tempLogId: string, realLogId: number) {
        const attachments = await db.attachments.where('progress_log_id').equals(tempLogId).toArray();
        for (const attachment of attachments) {
            await db.attachments.update(attachment.id!, { progress_log_id: realLogId });
        }
    }
}

// Export singleton instance
export const syncEngine = new SyncEngine();
