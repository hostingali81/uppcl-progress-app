// src/lib/db/operations.ts
import { db, LocalWork, LocalProgressLog, LocalAttachment, LocalComment, SyncQueue } from './schema';
import { v4 as uuidv4 } from 'uuid';

// ==================== Work Operations ====================

export async function createWorkOffline(work: Omit<LocalWork, 'id' | 'tempId' | 'syncStatus' | 'lastSyncAttempt' | 'syncError'>) {
    const tempId = `temp_work_${uuidv4()}`;
    const newWork: LocalWork = {
        ...work,
        tempId,
        syncStatus: 'pending',
        lastSyncAttempt: null,
        syncError: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const id = await db.works.add(newWork);

    // Add to sync queue
    await db.syncQueue.add({
        operation: 'create',
        entity: 'work',
        entityId: tempId,
        payload: newWork,
        createdAt: new Date().toISOString(),
        attempts: 0,
        maxAttempts: 5,
        nextRetry: null,
        status: 'pending',
        error: null
    });

    return { ...newWork, id };
}

export async function updateWorkOffline(id: number, updates: Partial<LocalWork>) {
    await db.works.update(id, {
        ...updates,
        syncStatus: 'pending',
        updated_at: new Date().toISOString()
    });

    const work = await db.works.get(id);
    if (work) {
        await db.syncQueue.add({
            operation: 'update',
            entity: 'work',
            entityId: work.tempId || String(work.id),
            payload: { id, updates },
            createdAt: new Date().toISOString(),
            attempts: 0,
            maxAttempts: 5,
            nextRetry: null,
            status: 'pending',
            error: null
        });
    }

    return work;
}

export async function getWorksOffline(userId?: string) {
    if (userId) {
        return await db.works.where('user_id').equals(userId).toArray();
    }
    return await db.works.toArray();
}

export async function getWorkByIdOffline(id: number) {
    return await db.works.get(id);
}

export async function getWorkByTempIdOffline(tempId: string) {
    return await db.works.where('tempId').equals(tempId).first();
}

// ==================== Progress Log Operations ====================

export async function createProgressLogOffline(log: Omit<LocalProgressLog, 'id' | 'tempId' | 'syncStatus' | 'lastSyncAttempt' | 'syncError'>) {
    const tempId = `temp_log_${uuidv4()}`;
    const newLog: LocalProgressLog = {
        ...log,
        tempId,
        syncStatus: 'pending',
        lastSyncAttempt: null,
        syncError: null,
        created_at: new Date().toISOString()
    };

    const id = await db.progressLogs.add(newLog);

    await db.syncQueue.add({
        operation: 'create',
        entity: 'progress_log',
        entityId: tempId,
        payload: newLog,
        createdAt: new Date().toISOString(),
        attempts: 0,
        maxAttempts: 5,
        nextRetry: null,
        status: 'pending',
        error: null
    });

    return { ...newLog, id };
}

export async function getProgressLogsOffline(workId: number | string) {
    return await db.progressLogs.where('work_id').equals(workId).toArray();
}

export async function getProgressLogByTempIdOffline(tempId: string) {
    return await db.progressLogs.where('tempId').equals(tempId).first();
}

// ==================== Attachment Operations ====================

export async function createAttachmentOffline(attachment: {
    work_id: number | string | null;
    progress_log_id: number | string | null;
    comment_id: number | string | null;
    file_name: string;
    file_blob: Blob;
    uploader_id: string;
    uploader_full_name: string;
    attachment_type: string;
}) {
    const tempId = `temp_attachment_${uuidv4()}`;
    const newAttachment: LocalAttachment = {
        ...attachment,
        tempId,
        file_url: null,
        syncStatus: 'pending',
        uploadProgress: 0,
        lastSyncAttempt: null,
        syncError: null,
        created_at: new Date().toISOString()
    };

    const id = await db.attachments.add(newAttachment);

    await db.syncQueue.add({
        operation: 'upload',
        entity: 'attachment',
        entityId: tempId,
        payload: newAttachment,
        createdAt: new Date().toISOString(),
        attempts: 0,
        maxAttempts: 5,
        nextRetry: null,
        status: 'pending',
        error: null
    });

    return { ...newAttachment, id };
}

export async function getAttachmentsOffline(workId: number | string) {
    return await db.attachments.where('work_id').equals(workId).toArray();
}

export async function getAttachmentsByProgressLogOffline(progressLogId: number | string) {
    return await db.attachments.where('progress_log_id').equals(progressLogId).toArray();
}

export async function updateAttachmentProgress(id: number, progress: number) {
    await db.attachments.update(id, { uploadProgress: progress });
}

export async function updateAttachmentStatus(
    id: number,
    status: 'pending' | 'uploading' | 'uploaded' | 'error',
    fileUrl?: string,
    error?: string
) {
    const updates: Partial<LocalAttachment> = {
        syncStatus: status,
        lastSyncAttempt: new Date().toISOString()
    };

    if (fileUrl) {
        updates.file_url = fileUrl;
    }

    if (error) {
        updates.syncError = error;
    }

    await db.attachments.update(id, updates);
}

// ==================== Comment Operations ====================

export async function createCommentOffline(comment: Omit<LocalComment, 'id' | 'tempId' | 'syncStatus' | 'lastSyncAttempt' | 'syncError'>) {
    const tempId = `temp_comment_${uuidv4()}`;
    const newComment: LocalComment = {
        ...comment,
        tempId,
        syncStatus: 'pending',
        lastSyncAttempt: null,
        syncError: null,
        created_at: new Date().toISOString()
    };

    const id = await db.comments.add(newComment);

    await db.syncQueue.add({
        operation: 'create',
        entity: 'comment',
        entityId: tempId,
        payload: newComment,
        createdAt: new Date().toISOString(),
        attempts: 0,
        maxAttempts: 5,
        nextRetry: null,
        status: 'pending',
        error: null
    });

    return { ...newComment, id };
}

export async function getCommentsOffline(workId: number | string) {
    return await db.comments.where('work_id').equals(workId).toArray();
}

// ==================== Sync Queue Operations ====================

export async function getPendingSyncItems() {
    return await db.syncQueue
        .where('status')
        .anyOf(['pending', 'failed'])
        .toArray();
}

export async function getProcessingSyncItems() {
    return await db.syncQueue
        .where('status')
        .equals('processing')
        .toArray();
}

export async function updateSyncItemStatus(
    id: number,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    error?: string
) {
    const updates: Partial<SyncQueue> = { status };

    if (error) {
        updates.error = error;
    }

    await db.syncQueue.update(id, updates);
}

export async function incrementSyncAttempts(id: number, nextRetryDate?: Date) {
    const item = await db.syncQueue.get(id);
    if (item) {
        await db.syncQueue.update(id, {
            attempts: item.attempts + 1,
            nextRetry: nextRetryDate ? nextRetryDate.toISOString() : null
        });
    }
}

export async function clearCompletedSyncItems() {
    await db.syncQueue.where('status').equals('completed').delete();
}

export async function clearAllSyncItems() {
    await db.syncQueue.clear();
}

// ==================== Utility Functions ====================

export async function clearAllOfflineData() {
    await db.works.clear();
    await db.progressLogs.clear();
    await db.attachments.clear();
    await db.comments.clear();
    await db.syncQueue.clear();
}

export async function getOfflineDataStats() {
    const [works, logs, attachments, comments, syncItems] = await Promise.all([
        db.works.count(),
        db.progressLogs.count(),
        db.attachments.count(),
        db.comments.count(),
        db.syncQueue.count()
    ]);

    const pendingSync = await db.syncQueue
        .where('status')
        .anyOf(['pending', 'processing'])
        .count();

    return {
        works,
        progressLogs: logs,
        attachments,
        comments,
        totalSyncItems: syncItems,
        pendingSync
    };
}
