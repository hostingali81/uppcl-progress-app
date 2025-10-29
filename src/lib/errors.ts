// src/lib/errors.ts
import { ERROR_MESSAGES } from './constants';
import type { ErrorResponse } from '@/types/shared';

export class AppError extends Error {
  public readonly code: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: number = 500,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON(): ErrorResponse {
    return {
      error: this.message,
      code: this.code,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.AUTHENTICATION.UNAUTHORIZED) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export const handleError = (error: unknown): ErrorResponse => {
  if (error instanceof AppError) {
    return error.toJSON();
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      code: 500,
    };
  }

  return {
    error: ERROR_MESSAGES.API.GENERAL_ERROR,
    code: 500,
  };
};

export const isErrorResponse = (response: unknown): response is ErrorResponse => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ErrorResponse).error === 'string'
  );
};