// ─── API Types ────────────────────────────────────────────────────────────────
// Matches the exact backend response envelope from utils/apiResponse.js

/** Standard success response from the backend */
export interface ApiResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

/** Paginated response from the backend */
export interface PaginatedApiResponse<T = unknown> {
  success: true;
  message: string;
  data: T[];
  pagination: PaginationMeta;
}

/** Pagination metadata from the backend */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/** Error response from the backend */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

/** Generic list query params */
export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
  [key: string]: string | number | boolean | undefined;
}
