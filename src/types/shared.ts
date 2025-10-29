// src/types/shared.ts

export type ErrorResponse = {
  error: string;
  code?: number;
};

export type SuccessResponse<T> = {
  data: T;
  message?: string;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export type PaginationParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type FilterParams = {
  search?: string;
  region?: string;
  division?: string;
  subdivision?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
};

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  region: string | null;
  division: string | null;
  subdivision: string | null;
  designation: string | null;
  phone: string | null;
  created_at: string;
}

export type UserRole = 'admin' | 'manager' | 'user';

export interface Work {
  id: number;
  region: string;
  division: string;
  subdivision: string;
  description: string;
  wbs: string;
  tender_amount: number | null;
  tender_date: string | null;
  vendor: string | null;
  time_period_in_days: number | null;
  status: WorkStatus | null;
  reason: string | null;
  user_id: string;
  created_at: string;
  updated_at: string | null;
  wom_date: string | null;
  completion_date: string | null;
  // Billing / payment fields (added to match DB schema)
  bill_no?: string | null;
  bill_amount_with_tax?: number | null;
  // Optional aggregated billed amount (may be computed/derived)
  total_billed_amount?: number | null;
}

export type WorkStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'delayed';

export interface ProgressLog {
  id: number;
  work_id: number;
  type: string;
  value: string | null;
  remark: string | null;
  user_id: string;
  created_at: string;
  bill_no: string | null;
  bill_amount: number | null;
  attachment_url: string | null;
}

export interface WorkWithProgress extends Work {
  progress_logs: ProgressLog[];
  latest_status?: ProgressLog;
  completion_percentage?: number;
}