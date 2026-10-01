import { apiClient } from '@/lib/api/client';
import type { Tenant, TenantListStats } from '@/types/tenant';
import type { RentRecord } from '@/types/rent';

export interface GetTenantsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  room?: string;
}

export interface AddTenantPayload {
  name: string;
  phone: string;
  email?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  profession?: string;
  aadhaar?: string;
  room?: string;
  bed?: string;
  joinDate: string;
  expectedLeaveDate?: string;
  noticePeriodDays?: number;
  lockInPeriodMonths?: number;
  monthlyRent: number;
  securityDeposit?: number;
  depositStatus?: string;
  foodPreference?: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  notes?: string;
}

export interface UpdateTenantPayload extends Partial<AddTenantPayload> {
  status?: string;
}

export interface VacateTenantPayload {
  actualLeaveDate?: string;
  refundDeposit?: boolean;
}

export interface TenantListResponse {
  tenants: Tenant[];
  stats: TenantListStats;
}

export const tenantApi = {
  getTenants: (pgId: string, params?: GetTenantsParams) =>
    apiClient.getPaginated<Tenant>(
      `/manage/pgs/${pgId}/tenants`,
      params as Record<string, string | number | boolean | undefined>
    ),

  getTenant: (id: string) =>
    apiClient.get<Tenant>(`/manage/tenants/${id}`),

  addTenant: (pgId: string, payload: AddTenantPayload) =>
    apiClient.post<Tenant>(`/manage/pgs/${pgId}/tenants`, payload),

  updateTenant: (id: string, payload: UpdateTenantPayload) =>
    apiClient.put<Tenant>(`/manage/tenants/${id}`, payload),

  searchExisting: (query: string) =>
    apiClient.get<Record<string, unknown>[]>('/manage/tenants/search-existing', { query }),

  assignBed: (tenantId: string, bedId: string) =>
    apiClient.post(`/manage/tenants/${tenantId}/assign-bed`, { bedId }),

  vacateTenant: (id: string, payload?: VacateTenantPayload) =>
    apiClient.post(`/manage/tenants/${id}/vacate`, payload || {}),

  getTenantRentRecords: (tenantId: string) =>
    apiClient.get<RentRecord[]>(`/manage/tenants/${tenantId}/rent`),
};
