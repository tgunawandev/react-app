/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * API error response
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}

/**
 * API request options
 */
export interface ApiRequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeout?: number;
}

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Query parameters
 */
export type QueryParams = Record<string, string | number | boolean | undefined>;

/**
 * Mutation result
 */
export interface MutationResult<T> {
  data?: T;
  error?: ApiError;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Register data
 */
export interface RegisterData {
  email: string;
  password: string;
  name: string;
}
