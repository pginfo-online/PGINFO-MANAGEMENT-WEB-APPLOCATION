'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  BedDouble,
  Calendar,
  IndianRupee,
  Shield,
  Clock,
  Utensils,
  User,
  Edit2,
  UserCheck,
  UserX,
  Trash2,
  RefreshCw,
  AlertCircle,
  FileText,
  Building,
  Home,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { useQuery } from '@tanstack/react-query';
import {
  useTenantDetail,
  useTenantRentRecords,
  useUpdateTenant,
  useAssignBed,
  useVacateTenant,
  useDeleteTenant,
} from '@/features/tenants/hooks/useTenants';
import {
  EditTenantModal,
  AssignBedModal,
  VacateTenantDialog,
  DeleteTenantDialog,
  TenantRentHistory,
} from '@/features/tenants/components';
import { formatINR, formatDate, formatPhone, getInitials } from '@/lib/utils';
import type { UpdateTenantPayload, VacateTenantPayload } from '@/types/tenant';

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;
  const tenantId = params.tenantId as string;
  const { toast } = useToast();

  // Dialog States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignBedOpen, setIsAssignBedOpen] = useState(false);
  const [isVacateOpen, setIsVacateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Property info for breadcrumbs
  const { data: dashboardData } = useQuery({
    queryKey: ['property-dashboard', propertyId],
    queryFn: () => dashboardApi.getPropertyDashboard(propertyId),
    enabled: !!propertyId,
  });
  const propertyName = dashboardData?.data?.property?.name || 'Property';

  // Tenant Details Query
  const {
    data: tenant,
    isLoading: isLoadingTenant,
    isRefetching: isRefetchingTenant,
    refetch: refetchTenant,
    isError,
    error,
  } = useTenantDetail(tenantId);

  // Tenant Rent Invoices Query
  const {
    data: rentRecords = [],
    isLoading: isLoadingRent,
    isRefetching: isRefetchingRent,
    refetch: refetchRent,
  } = useTenantRentRecords(tenantId);

  // Mutations
  const updateMutation = useUpdateTenant(propertyId);
  const assignBedMutation = useAssignBed(propertyId);
  const vacateMutation = useVacateTenant(propertyId);
  const deleteMutation = useDeleteTenant(propertyId);

  const handleRefresh = () => {
    refetchTenant();
    refetchRent();
  };

  const handleEditSubmit = async (id: string, payload: UpdateTenantPayload) => {
    try {
      await updateMutation.mutateAsync({ id, payload });
      toast.success('Resident Updated', 'Profile details saved successfully.');
      setIsEditOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update resident';
      toast.error('Update Failed', msg);
    }
  };

  const handleAssignBedSubmit = async (tId: string, bedId: string) => {
    try {
      await assignBedMutation.mutateAsync({ tenantId: tId, bedId });
      toast.success('Bed Allocated', 'Resident bed assignment has been updated.');
      setIsAssignBedOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign bed';
      toast.error('Assignment Failed', msg);
    }
  };

  const handleVacateSubmit = async (id: string, payload: VacateTenantPayload) => {
    try {
      await vacateMutation.mutateAsync({ id, payload });
      toast.success('Resident Vacated', 'Resident marked as vacated and bed has been freed.');
      setIsVacateOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to vacate resident';
      toast.error('Vacate Failed', msg);
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Record Deleted', 'Resident record was removed.');
      router.push(`/properties/${propertyId}/tenants`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete resident';
      toast.error('Delete Failed', msg);
    }
  };

  if (isLoadingTenant) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-6xl mx-auto pb-20">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !tenant) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto mt-16 p-8 text-center rounded-2xl border border-rose-500/20 bg-rose-500/10 space-y-4">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-[var(--ink)]">Resident Profile Not Found</h3>
          <p className="text-xs text-[var(--muted)]">
            {error instanceof Error ? error.message : 'Could not find this resident record.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/properties/${propertyId}/tenants`)}
            >
              Back to Registry
            </Button>
            <Button size="sm" onClick={() => refetchTenant()}>
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const roomObj = typeof tenant.room === 'object' ? tenant.room : null;
  const bedObj = typeof tenant.bed === 'object' ? tenant.bed : null;
  const roomNumber = roomObj?.roomNumber || tenant.roomNumber;
  const bedLabel = bedObj?.bedLabel || tenant.bedNumber;
  const cleanPhone = (tenant.phone || '').replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const isRefreshing = isRefetchingTenant || isRefetchingRent;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active Resident',
          cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
        };
      case 'notice':
        return {
          label: 'Under Notice',
          cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
        };
      case 'pending':
        return {
          label: 'Waiting to Move',
          cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
          dot: 'bg-blue-500',
        };
      case 'vacated':
        return {
          label: 'Vacated',
          cls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: status.toUpperCase(),
          cls: 'bg-[var(--line)] text-[var(--muted)] border-[var(--line-strong)]',
          dot: 'bg-[var(--muted)]',
        };
    }
  };

  const statusCfg = getStatusBadge(tenant.status || 'pending');

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        {/* ─── Breadcrumb Navigation ─── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/properties/${propertyId}/tenants`}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--card-subtle)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <Link href="/dashboard" className="hover:text-[var(--ink)] transition-colors flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                Dashboard
              </Link>
              <span>/</span>
              <Link href={`/properties/${propertyId}`} className="hover:text-[var(--ink)] transition-colors flex items-center gap-1">
                <Building className="h-3.5 w-3.5" />
                {propertyName}
              </Link>
              <span>/</span>
              <Link href={`/properties/${propertyId}/tenants`} className="hover:text-[var(--ink)] transition-colors">
                Tenants
              </Link>
              <span>/</span>
              <span className="font-bold text-[var(--ink)] truncate max-w-[160px] sm:max-w-xs">
                {tenant.name}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-2.5 gap-1.5 text-xs text-[var(--muted)]"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* ─── Header Profile Card ─── */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {tenant.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.profilePhoto}
                  alt={tenant.name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-emerald-500/30 ring-4 ring-emerald-500/10 shrink-0"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 font-extrabold text-emerald-600 dark:text-emerald-400 text-xl border-2 border-emerald-500/25">
                  {getInitials(tenant.name)}
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[var(--ink)] tracking-tight">
                    {tenant.name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${statusCfg.cls}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted)] flex-wrap">
                  <span className="font-semibold capitalize text-[var(--ink)]">
                    {tenant.profession?.replace(/_/g, ' ') || 'Resident'}
                  </span>
                  {tenant.email && (
                    <>
                      <span>•</span>
                      <span>{tenant.email}</span>
                    </>
                  )}
                  <span>•</span>
                  <span className="font-mono">{formatPhone(tenant.phone)}</span>
                </div>
              </div>
            </div>

            {/* Quick Contact & Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {cleanPhone && (
                <>
                  <a
                    href={`tel:${tenant.phone}`}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Call</span>
                  </a>

                  <a
                    href={`https://wa.me/${waPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-500 hover:bg-emerald-500/20 transition-all cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
                className="gap-1.5 text-xs font-bold"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssignBedOpen(true)}
                className="gap-1.5 text-xs font-bold"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>{bedObj ? 'Change Bed' : 'Assign Bed'}</span>
              </Button>

              {tenant.status !== 'vacated' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVacateOpen(true)}
                  className="gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                >
                  <UserX className="h-3.5 w-3.5" />
                  <span>Vacate</span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 p-2"
                title="Delete resident record"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Two-Column Details Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Tenancy, Room/Bed, Emergency (span 1) */}
          <div className="space-y-6 lg:col-span-1">
            {/* Room & Bed Allocation */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                  <BedDouble className="h-4 w-4 text-emerald-500" />
                  Bed Allocation
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAssignBedOpen(true)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  {bedObj ? 'Change' : 'Assign'}
                </button>
              </div>

              {roomNumber ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--muted)]">Room:</span>
                    <span className="font-bold text-[var(--ink)]">
                      Room {roomNumber} ({roomObj?.shareType || 'Standard'})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--muted)]">Bed Label:</span>
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                      {bedLabel || 'Assigned'}
                    </span>
                  </div>
                  {roomObj?.rentPerBed && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--muted)]">Standard Bed Rent:</span>
                      <span className="font-mono font-bold text-[var(--ink)]">
                        {formatINR(roomObj.rentPerBed)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-[var(--muted)] italic">
                    No bed currently assigned to this resident.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAssignBedOpen(true)}
                    className="text-xs gap-1"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Assign Bed Now
                  </Button>
                </div>
              )}
            </div>

            {/* Financial Terms Card */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] border-b border-[var(--line)] pb-3 flex items-center gap-1.5">
                <IndianRupee className="h-4 w-4 text-emerald-500" />
                Financial Terms
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Agreed Monthly Rent:</span>
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatINR(tenant.monthlyRent || tenant.rentAmount || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Security Deposit:</span>
                  <span className="font-mono font-bold text-[var(--ink)]">
                    {formatINR(tenant.securityDeposit || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Deposit Status:</span>
                  <span className="capitalize font-bold text-xs text-[var(--ink)]">
                    {tenant.depositStatus || 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Move-in Date:</span>
                  <span className="font-semibold text-[var(--ink)]">
                    {formatDate(tenant.joinDate || tenant.joiningDate)}
                  </span>
                </div>

                {tenant.expectedLeaveDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      Notice / Leave Date:
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {formatDate(tenant.expectedLeaveDate)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Billing Cycle:</span>
                  <span className="capitalize font-semibold text-[var(--ink)]">
                    {tenant.rentCycle === 'custom'
                      ? `Day ${tenant.billingDate || 1} of month`
                      : '1st of month (Standard)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Notice Period:</span>
                  <span className="font-semibold text-[var(--ink)]">
                    {tenant.noticePeriodDays || 30} Days
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Lock-in Period:</span>
                  <span className="font-semibold text-[var(--ink)]">
                    {tenant.lockInPeriodMonths ? `${tenant.lockInPeriodMonths} Months` : 'None'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Meal Preference:</span>
                  <span className="capitalize font-bold text-[var(--ink)] flex items-center gap-1">
                    <Utensils className="h-3 w-3 text-emerald-500" />
                    {tenant.foodPreference || 'Vegetarian'}
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            {(tenant.emergencyContact?.name || tenant.emergencyContactName) && (
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] border-b border-[var(--line)] pb-3">
                  Emergency Contact
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--ink)]">
                      {tenant.emergencyContact?.name || tenant.emergencyContactName}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {tenant.emergencyContact?.relationship || 'Guardian'} •{' '}
                      {formatPhone(tenant.emergencyContact?.phone || tenant.emergencyContactPhone)}
                    </p>
                  </div>
                  {(tenant.emergencyContact?.phone || tenant.emergencyContactPhone) && (
                    <a
                      href={`tel:${tenant.emergencyContact?.phone || tenant.emergencyContactPhone}`}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Identity & Aadhaar Proof */}
            {tenant.aadhaar && (
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 space-y-2 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Government ID / Aadhaar
                </h3>
                <p className="text-xs font-mono font-semibold text-[var(--ink)]">
                  {tenant.aadhaar}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Rent & Invoices History (span 2) */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[var(--ink)]">
                  Rent & Payment History
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Generated monthly rent records, payment status, receipts, and WhatsApp reminder alerts.
                </p>
              </div>
              <span className="text-xs text-[var(--muted)] font-mono font-bold">
                {rentRecords.length} {rentRecords.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>

            <TenantRentHistory
              records={rentRecords}
              tenantName={tenant.name}
              tenantPhone={tenant.phone}
              isLoading={isLoadingRent}
            />
          </div>
        </div>

        {/* ─── Modals ─── */}
        <EditTenantModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          tenant={tenant}
          onSubmit={handleEditSubmit}
          isPending={updateMutation.isPending}
        />

        <AssignBedModal
          open={isAssignBedOpen}
          onOpenChange={setIsAssignBedOpen}
          tenant={tenant}
          propertyId={propertyId}
          onSubmit={handleAssignBedSubmit}
          isPending={assignBedMutation.isPending}
        />

        <VacateTenantDialog
          open={isVacateOpen}
          onOpenChange={setIsVacateOpen}
          tenant={tenant}
          onSubmit={handleVacateSubmit}
          isPending={vacateMutation.isPending}
        />

        <DeleteTenantDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          tenant={tenant}
          onConfirm={handleDeleteConfirm}
          isPending={deleteMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
