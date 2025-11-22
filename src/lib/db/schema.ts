// src/lib/db/schema.ts
import Dexie, { Table } from 'dexie';

export interface LocalWork {
  id?: number; // Optional for new records
  tempId?: string; // Temporary ID for offline-created items
  region: string;
  division: string;
  subdivision: string;
  description: string;
  wbs: string;
  tender_amount: number | null;
  tender_date: string | null;
  vendor: string | null;
  time_period_in_days: number | null;
  status: string | null;
  reason: string | null;
  user_id: string;
  created_at: string;
  updated_at: string | null;
  wom_date: string | null;
  completion_date: string | null;
  bill_no: string | null;
  bill_amount_with_tax: number | null;
  // Sync metadata
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  lastSyncAttempt: string | null;
  syncError: string | null;
}

export interface LocalProgressLog {
  id?: number;
  tempId?: string;
  work_id: number | string; // Can be tempId for offline work
  type: string;
  value: string | null;
  remark: string | null;
  user_id: string;
  created_at: string;
  bill_no: string | null;
  bill_amount: number | null;
  attachment_url: string | null;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  lastSyncAttempt: string | null;
  syncError: string | null;
}

export interface LocalAttachment {
  id?: number;
  tempId?: string;
  work_id: number | string | null;
  progress_log_id: number | string | null;
  comment_id: number | string | null;
  file_name: string;
  file_url: string | null; // Null until uploaded
  file_blob: Blob | null; // Local blob for offline
  uploader_id: string;
  uploader_full_name: string;
  attachment_type: string;
  created_at: string;
  syncStatus: 'pending' | 'uploading' | 'uploaded' | 'error';
  uploadProgress: number; // 0-100
  lastSyncAttempt: string | null;
  syncError: string | null;
}

export interface LocalComment {
  id?: number;
  tempId?: string;
  work_id: number | string;
  user_id: string;
  user_full_name: string;
  comment_text: string;
  mentioned_users: string[];
  created_at: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  lastSyncAttempt: string | null;
  syncError: string | null;
}

export interface SyncQueue {
  id?: number;
  operation: 'create' | 'update' | 'delete' | 'upload';
  entity: 'work' | 'progress_log' | 'attachment' | 'comment';
  entityId: string; // tempId or real ID
  payload: any;
  createdAt: string;
  attempts: number;
  maxAttempts: number;
  nextRetry: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error: string | null;
}

export class UPPCLDatabase extends Dexie {
  works!: Table<LocalWork>;
  progressLogs!: Table<LocalProgressLog>;
  attachments!: Table<LocalAttachment>;
  comments!: Table<LocalComment>;
  syncQueue!: Table<SyncQueue>;

  constructor() {
    super('UPPCLDatabase');
    this.version(1).stores({
      works: '++id, tempId, user_id, syncStatus, created_at',
      progressLogs: '++id, tempId, work_id, user_id, syncStatus, created_at',
      attachments: '++id, tempId, work_id, progress_log_id, syncStatus, created_at',
      comments: '++id, tempId, work_id, user_id, syncStatus, created_at',
      syncQueue: '++id, status, entity, nextRetry, createdAt'
    });
  }
}

export const db = new UPPCLDatabase();
