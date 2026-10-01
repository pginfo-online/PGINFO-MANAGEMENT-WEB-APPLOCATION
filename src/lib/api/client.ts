import { env } from '@/config/env';
import { ApiError } from '@/lib/errors/api-error';
import { useAuthStore } from '@/lib/auth/store';
import type { ApiResponse, PaginatedApiResponse } from '@/types/api';

const API_BASE = env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = useAuthStore.getState().token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = new URL(`${API_BASE}${cleanPath}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          fullUrl.searchParams.append(key, String(value));
        }
      });
    }

    return fullUrl.toString();
  }

  private handleUnauthorized(): void {
    if (typeof window === 'undefined') return;
    const currentPath = window.location.pathname;
    useAuthStore.getState().clearAuth();

    if (!currentPath.startsWith('/login') && !currentPath.startsWith('/verify-otp')) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`${window.location.origin}/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }

  private async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, skipAuth = false, headers, ...restOptions } = options;
    const url = this.buildUrl(path, params);

    const authHeaders = skipAuth ? {} : this.getAuthHeader();
    const isFormData = restOptions.body instanceof FormData;

    const requestHeaders: HeadersInit = {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders,
      ...(headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.handleUnauthorized();
        throw new ApiError('Session expired. Please log in again.', 401);
      }

      // Handle empty response
      if (response.status === 204) {
        return {} as T;
      }

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw ApiError.fromResponse(response.status, json);
      }

      return json as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw ApiError.network(err);
    }
  }

  /** GET request returning ApiResponse<T> */
  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(path, {
      method: 'GET',
      params,
      ...options,
    });
  }

  /** GET request returning PaginatedApiResponse<T> */
  async getPaginated<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    options?: RequestOptions
  ): Promise<PaginatedApiResponse<T>> {
    return this.request<PaginatedApiResponse<T>>(path, {
      method: 'GET',
      params,
      ...options,
    });
  }

  /** POST request returning ApiResponse<T> */
  async post<T>(
    path: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /** PUT request returning ApiResponse<T> */
  async put<T>(
    path: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /** PATCH request returning ApiResponse<T> */
  async patch<T>(
    path: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(path, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /** DELETE request returning ApiResponse<T> */
  async delete<T = unknown>(
    path: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(path, {
      method: 'DELETE',
      ...options,
    });
  }

  /** Multipart upload */
  async upload<T>(
    path: string,
    formData: FormData,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(path, {
      method: 'POST',
      body: formData,
      ...options,
    });
  }
}

export const apiClient = new ApiClient();
