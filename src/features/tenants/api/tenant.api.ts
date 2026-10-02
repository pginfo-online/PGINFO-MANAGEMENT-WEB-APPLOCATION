import { apiClient } from '@/lib/api/client';
import type { ApiResponse, PaginatedApiResponse } from '@/types/api';
import type {
  Tenant,
  TenantListStats,
  GetTenantsParams,
  AddTenantPayload,
  UpdateTenantPayload,
  VacateTenantPayload,
  SystemUserSummary,
} from '@/types/tenant';
import type { RentRecord } from '@/types/rent';

export type {
  GetTenantsParams,
  AddTenantPayload,
  UpdateTenantPayload,
  VacateTenantPayload,
};

export interface TenantListApiResponse extends PaginatedApiResponse<Tenant> {
  stats: TenantListStats;
}

export const tenantApi = {
  /** Fetch tenants list with pagination, search, status filter and statistics */
  getTenants: (pgId: string, params?: GetTenantsParams) =>
    apiClient.getPaginated<Tenant>(
      `/manage/pgs/${pgId}/tenants`,
      params as Record<string, string | number | boolean | undefined>
    ) as Promise<TenantListApiResponse>,

  /** Get single tenant full profile with populated room, bed, user */
  getTenant: (id: string) =>
    apiClient.get<Tenant>(`/manage/tenants/${id}`),

  /** Onboard a new tenant to PG with optional room & bed allocation */
  addTenant: (pgId: string, payload: AddTenantPayload) =>
    apiClient.post<Tenant>(`/manage/pgs/${pgId}/tenants`, payload),

  /** Update tenant details (profile, terms, emergency contact, status) */
  updateTenant: (id: string, payload: UpdateTenantPayload) =>
    apiClient.put<Tenant>(`/manage/tenants/${id}`, payload),

  /** Search registered platform users by name, phone or email to auto-fill */
  searchExisting: (query: string) =>
    apiClient.get<SystemUserSummary[]>('/manage/tenants/search-existing', { query }),

  /** Assign or transfer a tenant to a specific vacant bed */
  assignBed: (tenantId: string, bedId: string) =>
    apiClient.post<{ tenant: Tenant; bed: unknown }>(`/manage/tenants/${tenantId}/assign-bed`, { bedId }),

  /** Vacate tenant, mark date, release bed and optionally refund deposit */
  vacateTenant: (id: string, payload?: VacateTenantPayload) =>
    apiClient.post<Tenant>(`/manage/tenants/${id}/vacate`, payload || {}),

  /** Permanently remove a tenant record and release any assigned bed */
  deleteTenant: (id: string) =>
    apiClient.delete<void>(`/manage/tenants/${id}`),

  /** Get rent invoices and payment history for a tenant */
  getTenantRentRecords: (tenantId: string) =>
    apiClient.get<RentRecord[]>(`/manage/tenants/${tenantId}/rent`),
};

export default tenantApi;
