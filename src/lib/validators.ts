// src/lib/validators.ts
import { z } from 'zod';
import { ROLES, PROGRESS_STATUS } from './constants';
import type { UserRole, WorkStatus } from '@/types/shared';

// User validation schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100).nullable(),
  email: z.string().email(),
  role: z.enum([ROLES.ADMIN, ROLES.MANAGER, ROLES.USER] as [UserRole, ...UserRole[]]),
  region: z.string().min(2).max(100).nullable(),
  division: z.string().min(2).max(100).nullable(),
  subdivision: z.string().min(2).max(100).nullable(),
  designation: z.string().min(2).max(100).nullable(),
  phone: z.string().min(10).max(15).nullable(),
  created_at: z.string().datetime(),
});

export const updateUserSchema = userSchema.partial().omit({
  id: true,
  created_at: true,
});

// Work validation schemas
export const workSchema = z.object({
  id: z.number().int().positive(),
  region: z.string().min(2).max(100),
  division: z.string().min(2).max(100),
  subdivision: z.string().min(2).max(100),
  description: z.string().min(10),
  wbs: z.string().min(2).max(50),
  tender_amount: z.number().nonnegative().nullable(),
  tender_date: z.string().datetime().nullable(),
  vendor: z.string().min(2).max(100).nullable(),
  time_period_in_days: z.number().int().positive().nullable(),
  status: z.enum([
    PROGRESS_STATUS.PENDING,
    PROGRESS_STATUS.IN_PROGRESS,
    PROGRESS_STATUS.COMPLETED,
    PROGRESS_STATUS.BLOCKED,
    PROGRESS_STATUS.DELAYED,
  ] as [WorkStatus, ...WorkStatus[]]).nullable(),
  reason: z.string().nullable(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
  wom_date: z.string().datetime().nullable(),
  completion_date: z.string().datetime().nullable(),
});

export const createWorkSchema = workSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    tender_amount: z.number().nonnegative().optional(),
    tender_date: z.string().datetime().optional(),
    vendor: z.string().min(2).max(100).optional(),
    time_period_in_days: z.number().int().positive().optional(),
    status: z.enum([
      PROGRESS_STATUS.PENDING,
      PROGRESS_STATUS.IN_PROGRESS,
      PROGRESS_STATUS.COMPLETED,
      PROGRESS_STATUS.BLOCKED,
      PROGRESS_STATUS.DELAYED,
    ] as [WorkStatus, ...WorkStatus[]]).optional(),
    reason: z.string().optional(),
    wom_date: z.string().datetime().optional(),
    completion_date: z.string().datetime().optional(),
  });

export const updateWorkSchema = createWorkSchema.partial();

// Progress log validation schemas
export const progressLogSchema = z.object({
  id: z.number().int().positive(),
  work_id: z.number().int().positive(),
  type: z.string().min(2).max(50),
  value: z.string().nullable(),
  remark: z.string().nullable(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  bill_no: z.string().nullable(),
  bill_amount: z.number().nonnegative().nullable(),
  attachment_url: z.string().url().nullable(),
});

export const createProgressLogSchema = progressLogSchema
  .omit({
    id: true,
    created_at: true,
  })
  .extend({
    value: z.string().optional(),
    remark: z.string().optional(),
    bill_no: z.string().optional(),
    bill_amount: z.number().nonnegative().optional(),
    attachment_url: z.string().url().optional(),
  });

export const updateProgressLogSchema = createProgressLogSchema
  .partial()
  .omit({ work_id: true, user_id: true });

// Utility validation schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const filterSchema = z.object({
  search: z.string().optional(),
  region: z.string().optional(),
  division: z.string().optional(),
  subdivision: z.string().optional(),
  status: z.enum([
    PROGRESS_STATUS.PENDING,
    PROGRESS_STATUS.IN_PROGRESS,
    PROGRESS_STATUS.COMPLETED,
    PROGRESS_STATUS.BLOCKED,
    PROGRESS_STATUS.DELAYED,
  ] as [WorkStatus, ...WorkStatus[]]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});