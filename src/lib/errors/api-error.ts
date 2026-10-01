export class ApiError extends Error {
  public statusCode: number;
  public errors?: Record<string, string[]>;
  public isNetworkError: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    errors?: Record<string, string[]>,
    isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isNetworkError = isNetworkError;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromResponse(
    statusCode: number,
    data?: { message?: string; errors?: Record<string, string[]> } | null
  ): ApiError {
    const message = data?.message || 'An unexpected error occurred';
    const errors = data?.errors;
    return new ApiError(message, statusCode, errors);
  }

  static network(err: unknown): ApiError {
    const msg =
      err instanceof Error
        ? err.message
        : 'Network error: Please check your internet connection';
    return new ApiError(msg, 0, undefined, true);
  }
}
