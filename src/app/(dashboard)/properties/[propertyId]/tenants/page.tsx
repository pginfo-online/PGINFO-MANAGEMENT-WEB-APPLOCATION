'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  LayoutGrid,
  List,
  RefreshCw,
  X,
  UserPlus,
  AlertCircle,
  Building,
  Home,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { useQuery } from '@tanstack/react-query';

import {
  useTenants,
  useAddTenant,
  useUpdateTenant,
  useAssignBed,
  useVacateTenant,
  useDeleteTenant,
} from '@/features/tenants/hooks/useTenants';
import {
  TenantMetricsGrid,
  TenantActionRows,
  TenantCard,
  TenantTable,
  TenantWizardModal,
  EditTenantModal,
  AssignBedModal,
  VacateTenantDialog,
  DeleteTenantDialog,
} from '@/features/tenants/components';
import type { Tenant, AddTenantPayload, UpdateTenantPayload, VacateTenantPayload } from '@/types/tenant';

export default function TenantsRegistryPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;
  const { toast } = useToast();

  // Search & Filter State
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [page, setPage] = useState(1);
  const limit = 24;

  // Modals State
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [assigningBedTenant, setAssigningBedTenant] = useState<Tenant | null>(null);
  const [vacatingTenant, setVacatingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Reset page when filter changes
  const handleStatusFilterChange = (filter: string) => {
    setStatusFilter(filter);
    setPage(1);
  };

  // Property Details for breadcrumb
  const { data: dashboardData } = useQuery({
    queryKey: ['property-dashboard', propertyId],
    queryFn: () => dashboardApi.getPropertyDashboard(propertyId),
    enabled: !!propertyId,
  });
  const propertyName = dashboardData?.data?.property?.name || 'Property';

  // Fetch Tenants query
  const queryParams = useMemo(() => {
    const p: Record<string, string | number | undefined> = {
      page,
      limit,
    };
    if (statusFilter !== 'all') {
      p.status = statusFilter;
    }
    if (debouncedSearch) {
      p.search = debouncedSearch;
    }
    return p;
  }, [page, limit, statusFilter, debouncedSearch]);

  const {
    data: tenantsData,
    isLoading,
    isRefetching,
    refetch,
    isError,
    error,
  } = useTenants(propertyId, queryParams);

  const tenants = tenantsData?.tenants || [];
  const stats = tenantsData?.stats || {
    totalTenants: tenants.length,
    pendingDue: 0,
    underNotice: 0,
    todayBooking: 0,
    waitingToMove: 0,
    movedOut: 0,
  };
  const pagination = tenantsData?.pagination || { page: 1, limit, total: tenants.length, pages: 1 };

  // Mutations
  const addMutation = useAddTenant(propertyId);
  const updateMutation = useUpdateTenant(propertyId);
  const assignBedMutation = useAssignBed(propertyId);
  const vacateMutation = useVacateTenant(propertyId);
  const deleteMutation = useDeleteTenant(propertyId);

  // Mutation Handlers
  const handleOnboardSubmit = async (payload: AddTenantPayload) => {
    try {
      await addMutation.mutateAsync(payload);
      toast.success(
        'Resident Onboarded',
        `${payload.name} has been successfully registered.`
      );
      setIsOnboardModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register resident';
      toast.error('Onboarding Failed', msg);
    }
  };

  const handleEditSubmit = async (id: string, payload: UpdateTenantPayload) => {
    try {
      await updateMutation.mutateAsync({ id, payload });
      toast.success('Resident Updated', 'Profile changes have been saved.');
      setEditingTenant(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update resident';
      toast.error('Update Failed', msg);
    }
  };

  const handleAssignBedSubmit = async (tenantId: string, bedId: string) => {
    try {
      await assignBedMutation.mutateAsync({ tenantId, bedId });
      toast.success('Bed Allocated', 'Resident bed allocation updated successfully.');
      setAssigningBedTenant(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign bed';
      toast.error('Assignment Failed', msg);
    }
  };

  const handleVacateSubmit = async (id: string, payload: VacateTenantPayload) => {
    try {
      await vacateMutation.mutateAsync({ id, payload });
      toast.success('Resident Vacated', 'Resident marked as vacated and bed released.');
      setVacatingTenant(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to vacate resident';
      toast.error('Vacate Failed', msg);
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Record Deleted', 'Resident record removed.');
      setDeletingTenant(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete resident';
      toast.error('Delete Failed', msg);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20">
        {/* Page Header */}
        <PageHeader
          title="Tenants Registry"
          description="Manage active residents, room & bed assignments, notices, deposits, and vacating workflows."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: propertyName, href: `/properties/${propertyId}` },
            { label: 'Tenants' },
          ]}
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-9 px-3 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              onClick={() => setIsOnboardModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 gap-1.5 shadow-sm cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Onboard Resident</span>
            </Button>
          </div>
        </PageHeader>

        {/* ─── 1. Metrics Grid (2x2) Matching Mobile Reference ─── */}
        <TenantMetricsGrid
          stats={stats}
          activeFilter={statusFilter}
          onFilterChange={handleStatusFilterChange}
          onPendingDueClick={() => router.push(`/properties/${propertyId}/rent`)}
        />

        {/* ─── 2. Quick Action Rows Matching Mobile Reference ─── */}
        <TenantActionRows
          stats={stats}
          activeFilter={statusFilter}
          onFilterChange={handleStatusFilterChange}
        />

        {/* ─── 3. Search Bar, Status Filter Tabs, View Switcher ─── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl border border-[var(--line)] bg-[var(--card)]">
            {[
              { id: 'all', label: 'All', count: stats.totalTenants },
              { id: 'active', label: 'Active', count: undefined },
              { id: 'notice', label: 'Under Notice', count: stats.underNotice },
              { id: 'waiting_to_move', label: 'Waiting', count: stats.waitingToMove },
              { id: 'moved_out', label: 'Moved Out', count: stats.movedOut },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleStatusFilterChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--card-subtle)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-emerald-500 text-white'
                          : 'bg-[var(--line)] text-[var(--muted)]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Toolbar: Search & View Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Input
                placeholder="Search name, phone, email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                icon={<Search className="h-4 w-4 text-[var(--muted)]" />}
                className="h-9 text-xs"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-2.5 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* View Switcher */}
            <div className="flex items-center rounded-xl border border-[var(--line)] bg-[var(--card)] p-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table view"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[var(--line)] text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Card grid view"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[var(--line)] text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Indicator Tag */}
        {(statusFilter !== 'all' || debouncedSearch) && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--muted)]">Active filters:</span>
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Status: {statusFilter.replace(/_/g, ' ')}
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className="ml-1 hover:text-emerald-800 dark:hover:text-emerald-200 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Query: &quot;{debouncedSearch}&quot;
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="ml-1 hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setSearchInput('');
              }}
              className="text-xs text-[var(--muted)] hover:text-rose-500 underline ml-2 cursor-pointer"
            >
              Reset all
            </button>
          </div>
        )}

        {/* ─── 4. Main Content: Skeleton, Empty State, Grid or Table ─── */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
            <h4 className="text-sm font-bold text-[var(--ink)]">Failed to load residents</h4>
            <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
              {error instanceof Error ? error.message : 'An error occurred while connecting to server.'}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
              Retry Connection
            </Button>
          </div>
        ) : tenants.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<Users className="h-10 w-10 text-emerald-500" />}
              title={debouncedSearch ? 'No residents matched' : 'No tenants found'}
              description={
                debouncedSearch
                  ? `No residents matching "${debouncedSearch}". Try another search term or clear filters.`
                  : statusFilter !== 'all'
                  ? `There are no tenants currently listed under the "${statusFilter.replace(
                      /_/g,
                      ' '
                    )}" status.`
                  : 'Start by onboarding your first resident into this property.'
              }
              actionLabel={debouncedSearch || statusFilter !== 'all' ? 'Clear Filters' : 'Onboard Resident'}
              onAction={
                debouncedSearch || statusFilter !== 'all'
                  ? () => {
                      setStatusFilter('all');
                      setSearchInput('');
                    }
                  : () => setIsOnboardModalOpen(true)
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resident Count Badge */}
            <div className="flex items-center justify-between text-xs text-[var(--muted)] px-1">
              <span>
                SHOWING <strong className="text-[var(--ink)]">{tenants.length}</strong> OF{' '}
                <strong className="text-[var(--ink)]">{pagination.total}</strong> RESIDENTS
              </span>
            </div>

            {/* Display View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenants.map((t) => (
                  <TenantCard
                    key={t._id}
                    tenant={t}
                    propertyId={propertyId}
                    onEdit={setEditingTenant}
                    onAssignBed={setAssigningBedTenant}
                    onVacate={setVacatingTenant}
                    onDelete={setDeletingTenant}
                  />
                ))}
              </div>
            ) : (
              <TenantTable
                tenants={tenants}
                propertyId={propertyId}
                onEdit={setEditingTenant}
                onAssignBed={setAssigningBedTenant}
                onVacate={setVacatingTenant}
                onDelete={setDeletingTenant}
              />
            )}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--line)] pt-4 px-2">
                <span className="text-xs text-[var(--muted)]">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-8 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── 5. Dialogs & Modals ─── */}
        {/* Onboard Wizard Modal */}
        <TenantWizardModal
          open={isOnboardModalOpen}
          onOpenChange={setIsOnboardModalOpen}
          propertyId={propertyId}
          onSubmit={handleOnboardSubmit}
          isPending={addMutation.isPending}
        />

        {/* Edit Tenant Modal */}
        <EditTenantModal
          open={!!editingTenant}
          onOpenChange={(open) => !open && setEditingTenant(null)}
          tenant={editingTenant}
          onSubmit={handleEditSubmit}
          isPending={updateMutation.isPending}
        />

        {/* Assign Bed Modal */}
        <AssignBedModal
          open={!!assigningBedTenant}
          onOpenChange={(open) => !open && setAssigningBedTenant(null)}
          tenant={assigningBedTenant}
          propertyId={propertyId}
          onSubmit={handleAssignBedSubmit}
          isPending={assignBedMutation.isPending}
        />

        {/* Vacate Tenant Dialog */}
        <VacateTenantDialog
          open={!!vacatingTenant}
          onOpenChange={(open) => !open && setVacatingTenant(null)}
          tenant={vacatingTenant}
          onSubmit={handleVacateSubmit}
          isPending={vacateMutation.isPending}
        />

        {/* Delete Tenant Dialog */}
        <DeleteTenantDialog
          open={!!deletingTenant}
          onOpenChange={(open) => !open && setDeletingTenant(null)}
          tenant={deletingTenant}
          onConfirm={handleDeleteConfirm}
          isPending={deleteMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
