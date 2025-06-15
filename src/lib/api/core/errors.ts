export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(response: Response, errorData?: any): ApiError {
    const message = errorData?.detail || errorData?.message || `API error: ${response.status} ${response.statusText}`;
    return new ApiError(message, response.status, errorData?.code, errorData);
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  isNotFoundError(): boolean {
    return this.statusCode === 404;
  }

  isValidationError(): boolean {
    return this.statusCode === 400 || this.statusCode === 422;
  }

  isServerError(): boolean {
    return (this.statusCode ?? 0) >= 500;
  }

  isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR';
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = 'Network error occurred') {
    super(message, undefined, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}