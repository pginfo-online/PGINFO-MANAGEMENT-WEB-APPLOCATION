'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '../api/tenant.api';
import type {
  GetTenantsParams,
  AddTenantPayload,
  UpdateTenantPayload,
  VacateTenantPayload,
} from '@/types/tenant';

export const TENANT_QUERY_KEYS = {
  all: ['tenants'] as const,
  list: (pgId: string, params?: GetTenantsParams) => ['pg-tenants', pgId, params] as const,
  detail: (tenantId: string) => ['tenant-detail', tenantId] as const,
  rent: (tenantId: string) => ['tenant-rent-records', tenantId] as const,
  searchUsers: (query: string) => ['tenant-user-search', query] as const,
};

/**
 * Hook to fetch tenants list for a PG with filters & stats
 */
export function useTenants(pgId: string, params: GetTenantsParams = {}) {
  return useQuery({
    queryKey: TENANT_QUERY_KEYS.list(pgId, params),
    queryFn: () => tenantApi.getTenants(pgId, params),
    enabled: Boolean(pgId),
    select: (res) => ({
      tenants: res?.data || [],
      pagination: res?.pagination || { page: 1, limit: 20, total: 0, pages: 1 },
      stats: res?.stats || {
        totalTenants: (res?.data || []).length,
        pendingDue: 0,
        underNotice: 0,
        todayBooking: 0,
        waitingToMove: 0,
        movedOut: 0,
      },
    }),
  });
}

/**
 * Hook to fetch single tenant full detail
 */
export function useTenantDetail(tenantId?: string) {
  return useQuery({
    queryKey: TENANT_QUERY_KEYS.detail(tenantId || ''),
    queryFn: () => tenantApi.getTenant(tenantId!),
    enabled: Boolean(tenantId),
    select: (res) => res?.data,
  });
}

/**
 * Hook to fetch rent invoice history for a tenant
 */
export function useTenantRentRecords(tenantId?: string) {
  return useQuery({
    queryKey: TENANT_QUERY_KEYS.rent(tenantId || ''),
    queryFn: () => tenantApi.getTenantRentRecords(tenantId!),
    enabled: Boolean(tenantId),
    select: (res) => (Array.isArray(res?.data) ? res.data : []),
  });
}

/**
 * Hook to search existing system users for auto-filling onboarding
 */
export function useSearchExistingUsers(query: string) {
  const cleanQuery = query.trim();
  return useQuery({
    queryKey: TENANT_QUERY_KEYS.searchUsers(cleanQuery),
    queryFn: () => tenantApi.searchExisting(cleanQuery),
    enabled: cleanQuery.length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
    select: (res) => res?.data || [],
  });
}

/**
 * Hook to add a new tenant
 */
export function useAddTenant(pgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddTenantPayload) => tenantApi.addTenant(pgId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pg-tenants', pgId] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['pg-rooms', pgId] });
      queryClient.invalidateQueries({ queryKey: ['mgmt-rooms', pgId] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', pgId] });
    },
  });
}

/**
 * Hook to update tenant details
 */
export function useUpdateTenant(pgId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTenantPayload }) =>
      tenantApi.updateTenant(id, payload),
    onSuccess: (res, { id }) => {
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.detail(id) });
      if (pgId) {
        queryClient.invalidateQueries({ queryKey: ['pg-tenants', pgId] });
        queryClient.invalidateQueries({ queryKey: ['property-dashboard', pgId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['pg-tenants'] });
      }
    },
  });
}

/**
 * Hook to assign or change tenant's bed
 */
export function useAssignBed(pgId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, bedId }: { tenantId: string; bedId: string }) =>
      tenantApi.assignBed(tenantId, bedId),
    onSuccess: (res, { tenantId }) => {
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.detail(tenantId) });
      queryClient.invalidateQueries({ queryKey: ['pg-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['mgmt-rooms'] });
      if (pgId) {
        queryClient.invalidateQueries({ queryKey: ['pg-tenants', pgId] });
        queryClient.invalidateQueries({ queryKey: ['property-dashboard', pgId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['pg-tenants'] });
      }
    },
  });
}

/**
 * Hook to vacate a tenant
 */
export function useVacateTenant(pgId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: VacateTenantPayload }) =>
      tenantApi.vacateTenant(id, payload),
    onSuccess: (res, { id }) => {
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['pg-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['mgmt-rooms'] });
      if (pgId) {
        queryClient.invalidateQueries({ queryKey: ['pg-tenants', pgId] });
        queryClient.invalidateQueries({ queryKey: ['property-dashboard', pgId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['pg-tenants'] });
      }
    },
  });
}

/**
 * Hook to delete a tenant
 */
export function useDeleteTenant(pgId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tenantApi.deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pg-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['mgmt-rooms'] });
      if (pgId) {
        queryClient.invalidateQueries({ queryKey: ['pg-tenants', pgId] });
        queryClient.invalidateQueries({ queryKey: ['property-dashboard', pgId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['pg-tenants'] });
      }
    },
  });
}
