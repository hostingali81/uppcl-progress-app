// src/lib/constants.ts

export const AUTH = {
  COOKIE_NAME: 'sb-access-token',
  REFRESH_COOKIE_NAME: 'sb-refresh-token',
  SESSION_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

export const CACHE = {
  USER_PROFILE_TTL: 5 * 60 * 1000, // 5 minutes
  WORK_LIST_TTL: 2 * 60 * 1000, // 2 minutes
  PROGRESS_LOGS_TTL: 60 * 1000, // 1 minute
} as const;

export const CACHE_KEYS = {
  userProfile: (userId: string) => `user_profile_${userId}`,
  userWorks: (userId: string, role: string, value?: string) =>
    `user_works_${userId}_${role}_${value || 'all'}`,
  schemeWorks: (schemeName: string, userId: string, role: string, value?: string) =>
    `scheme_works_${schemeName}_${userId}_${role}_${value || 'all'}`,
  progressLogs: (workId?: string) =>
    workId ? `progress_logs_${workId}` : 'progress_logs_all',
  allUsers: () => 'all_users',
  allProfiles: () => 'all_profiles',
  settings: () => 'app_settings',
  analytics: (timeframe: string) => `analytics_${timeframe}`,
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  BUCKET_NAME: 'attachments',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  USERS: {
    LIST: '/users',
    PROFILE: (userId: string) => `/users/${userId}/profile`,
    UPDATE: (userId: string) => `/users/${userId}`,
  },
  WORKS: {
    LIST: '/works',
    DETAIL: (workId: number) => `/works/${workId}`,
    PROGRESS: (workId: number) => `/works/${workId}/progress`,
  },
} as const;

export const ERROR_MESSAGES = {
  AUTHENTICATION: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    SESSION_EXPIRED: 'Your session has expired. Please log in again',
    UNAUTHORIZED: 'You are not authorized to perform this action',
  },
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PHONE: 'Please enter a valid phone number',
    INVALID_DATE: 'Please enter a valid date',
    PASSWORD_REQUIREMENTS: 'Password must be at least 8 characters long',
  },
  API: {
    GENERAL_ERROR: 'Something went wrong. Please try again later',
    NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection',
    TIMEOUT: 'Request timed out. Please try again',
  },
} as const;

export const DATE_FORMATS = {
  DISPLAY: {
    SHORT: 'DD/MM/YYYY',
    LONG: 'DD MMM YYYY',
    WITH_TIME: 'DD MMM YYYY HH:mm',
  },
  API: 'YYYY-MM-DD',
} as const;

export const PROGRESS_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
  DELAYED: 'delayed',
} as const;

export const WORK_STATUS_OPTIONS = {
  MB_STATUS: ['Running', 'Final'],
  TECO_STATUS: ['Done', 'Not Done'],
  FICO_STATUS: ['Done', 'Not Done'],
} as const;

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
} as const;

export const ANALYTICS = {
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  CHART_COLORS: {
    PRIMARY: '#3b82f6',
    SECONDARY: '#64748b',
    SUCCESS: '#22c55e',
    WARNING: '#eab308',
    DANGER: '#ef4444',
  },
} as const;
