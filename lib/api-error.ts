import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standard API error codes
 */
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

/**
 * Custom API error class with structured error information
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ApiErrorCode = ApiErrorCode.INTERNAL_SERVER_ERROR,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Factory method for validation errors
   */
  static validation(message: string, details?: any): ApiError {
    return new ApiError(message, 400, ApiErrorCode.VALIDATION_ERROR, details);
  }

  /**
   * Factory method for bad request errors
   */
  static badRequest(message: string, details?: any): ApiError {
    return new ApiError(message, 400, ApiErrorCode.BAD_REQUEST, details);
  }

  /**
   * Factory method for not found errors
   */
  static notFound(message: string, details?: any): ApiError {
    return new ApiError(message, 404, ApiErrorCode.NOT_FOUND, details);
  }

  /**
   * Factory method for rate limit errors
   */
  static rateLimit(message: string, details?: any): ApiError {
    return new ApiError(message, 429, ApiErrorCode.RATE_LIMIT_EXCEEDED, details);
  }

  /**
   * Factory method for external API errors
   */
  static externalApi(message: string, details?: any): ApiError {
    return new ApiError(message, 502, ApiErrorCode.EXTERNAL_API_ERROR, details);
  }

  /**
   * Factory method for internal server errors
   */
  static internal(message: string, details?: any): ApiError {
    return new ApiError(message, 500, ApiErrorCode.INTERNAL_SERVER_ERROR, details);
  }
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code: ApiErrorCode;
  details?: any;
  timestamp: string;
}

/**
 * Handles API errors and returns a standardized NextResponse
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  console.error('API Error:', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors = error.errors.map(err => {
      const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
      return `${path}${err.message}`;
    });

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: 'Validation failed',
        code: ApiErrorCode.VALIDATION_ERROR,
        details: {
          errors: validationErrors,
          issues: error.errors,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // Handle custom ApiError
  if (error instanceof ApiError) {
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check if it's a known error type by message
    if (error.message.includes('fetch') || error.message.includes('API')) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'External API request failed',
          code: ApiErrorCode.EXTERNAL_API_ERROR,
          details: { message: error.message },
          timestamp: new Date().toISOString(),
        },
        { status: 502 }
      );
    }

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: error.message || 'Internal server error',
        code: ApiErrorCode.INTERNAL_SERVER_ERROR,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  // Handle unknown error types
  return NextResponse.json<ErrorResponse>(
    {
      success: false,
      error: 'An unexpected error occurred',
      code: ApiErrorCode.INTERNAL_SERVER_ERROR,
      details: { rawError: String(error) },
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}

/**
 * Wraps an async API handler with error handling
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse<R>>
): (...args: T) => Promise<NextResponse<R | ErrorResponse>> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}