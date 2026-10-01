'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  BedDouble,
  Users,
  Wallet,
  Receipt,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { formatINR } from '@/lib/utils';

export default function PropertyOverviewPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['property-dashboard', propertyId],
    queryFn: () => dashboardApi.getPropertyDashboard(propertyId),
    enabled: !!propertyId,
  });

  const dashboard = data?.data;
  const property = dashboard?.property;

  // Defensive metrics extraction supporting both flat & nested backend structures
  const totalBeds = dashboard?.occupancy?.totalBeds || 0;
  const occupiedBeds = dashboard?.occupancy?.occupiedBeds || 0;
  const occupancyRate = dashboard?.occupancy?.occupancyRate || 0;

  const totalRooms = dashboard?.occupancy?.totalRooms ?? dashboard?.occupancy?.rooms?.totalRooms ?? 0;
  const occupiedRooms = dashboard?.occupancy?.occupiedRooms ?? dashboard?.occupancy?.rooms?.occupiedRooms ?? 0;
  const partialRooms = dashboard?.occupancy?.partialRooms ?? dashboard?.occupancy?.rooms?.partialRooms ?? 0;
  const vacantRooms = dashboard?.occupancy?.vacantRooms ?? dashboard?.occupancy?.rooms?.vacantRooms ?? 0;

  const overdueRentsCount = dashboard?.alerts?.overdueRentsCount ?? dashboard?.alerts?.overdueCount ?? 0;
  const tenantsOnNoticeCount =
    dashboard?.alerts?.tenantsOnNoticeCount ??
    dashboard?.alerts?.noticeTenants?.length ??
    dashboard?.counts?.noticeTenantsCount ??
    dashboard?.counts?.noticeTenants ??
    0;

  const totalCollected = dashboard?.financials?.totalCollected || 0;
  const totalDue = dashboard?.financials?.totalDue || 0;
  const totalPending = dashboard?.financials?.totalPending || 0;
  const collectionRate = dashboard?.financials?.collectionRate || 0;
  const totalExpenses = dashboard?.financials?.totalExpenses || 0;
  const netProfit = dashboard?.financials?.netProfit || 0;
  const paidCount = dashboard?.financials?.paidCount || 0;
  const pendingCount = dashboard?.financials?.pendingCount || 0;

  const activeTenants = dashboard?.counts?.activeTenants || 0;

  return (
    <DashboardLayout propertyId={propertyId}>
      <PageHeader
        title={property?.name || 'Property Overview'}
        description={
          property
            ? `${property.area ? `${property.area}, ` : ''}${property.city || ''} — Operational Dashboard`
            : 'Operational Dashboard'
        }
        breadcrumbs={[
          { label: 'Properties', href: '/dashboard' },
          { label: property?.name || 'Property', href: `/properties/${propertyId}` },
        ]}
      >
        <Link href={`/properties/${propertyId}/edit`}>
          <Button variant="outline" size="sm" className="rounded-xl border-slate-700">
            <TrendingUp className="h-4 w-4 mr-1.5 hidden" />
            <span className="flex items-center gap-1.5">
              <span>Edit Property</span>
            </span>
          </Button>
        </Link>
        <Link href={`/properties/${propertyId}/rooms`}>
          <Button variant="outline" size="sm" className="rounded-xl border-slate-700">
            <BedDouble className="h-4 w-4 mr-1.5" />
            Rooms & Beds
          </Button>
        </Link>
        <Link href={`/properties/${propertyId}/tenants/new`}>
          <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
            <Plus className="h-4 w-4 mr-1" />
            Add Tenant
          </Button>
        </Link>
      </PageHeader>

      {isLoading ? (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-xl lg:col-span-2" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      ) : error ? (
        <div className="mt-8 rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center text-rose-300">
          Failed to load property data. Please ensure the property ID is valid.
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Action Alerts */}
          {overdueRentsCount > 0 || tenantsOnNoticeCount > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {overdueRentsCount > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {overdueRentsCount} Overdue Rent Invoices
                      </h4>
                      <p className="text-xs text-slate-400">
                        Tenants with outstanding payments past due date.
                      </p>
                    </div>
                  </div>
                  <Link href={`/properties/${propertyId}/rent?status=overdue`}>
                    <Button variant="subtle" size="sm">
                      Send Reminders
                    </Button>
                  </Link>
                </div>
              )}

              {tenantsOnNoticeCount > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-sky-500/20 bg-sky-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-sky-500/20 p-2 text-sky-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {tenantsOnNoticeCount} Tenants on Notice
                      </h4>
                      <p className="text-xs text-slate-400">
                        Upcoming bed vacancies requiring marketing.
                      </p>
                    </div>
                  </div>
                  <Link href={`/properties/${propertyId}/tenants?status=notice`}>
                    <Button variant="secondary" size="sm">
                      View Tenants
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : null}

          {/* Key Metric Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Bed Occupancy"
              value={`${occupancyRate}%`}
              subtitle={`${occupiedBeds} occupied of ${totalBeds} total beds`}
              icon={<BedDouble className="h-5 w-5" />}
              accentColor="emerald"
            />
            <StatCard
              title="Rent Collection Rate"
              value={`${collectionRate}%`}
              subtitle={`Collected: ${formatINR(totalCollected)}`}
              icon={<Receipt className="h-5 w-5" />}
              accentColor="sky"
            />
            <StatCard
              title="Total Rent Due"
              value={formatINR(totalDue)}
              subtitle={`Pending balance: ${formatINR(totalPending)}`}
              icon={<TrendingUp className="h-5 w-5" />}
              accentColor="amber"
            />
            <StatCard
              title="Net Property Profit"
              value={formatINR(netProfit)}
              subtitle={`Expenses: ${formatINR(totalExpenses)}`}
              icon={<Wallet className="h-5 w-5" />}
              accentColor={netProfit >= 0 ? 'emerald' : 'rose'}
            />
          </div>

          {/* Operational Sections */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Room Breakdown Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Room & Bed Allocation</h3>
                  <p className="text-xs text-slate-400">Current occupancy distribution</p>
                </div>
                <Link href={`/properties/${propertyId}/rooms`}>
                  <Button variant="ghost" size="sm">
                    <span>Manage Rooms</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-center">
                  <p className="text-xs text-slate-400">Total Rooms</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {totalRooms}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                  <p className="text-xs text-emerald-300">Fully Occupied</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-400">
                    {occupiedRooms}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
                  <p className="text-xs text-amber-300">Partial Beds Open</p>
                  <p className="mt-1 text-2xl font-bold text-amber-400">
                    {partialRooms}
                  </p>
                </div>
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-center">
                  <p className="text-xs text-rose-300">Fully Vacant</p>
                  <p className="mt-1 text-2xl font-bold text-rose-400">
                    {vacantRooms}
                  </p>
                </div>
              </div>

              {/* Occupancy Progress Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Occupancy Capacity</span>
                  <span className="font-semibold text-white">
                    {occupiedBeds} / {totalBeds} Beds Occupied
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                    style={{
                      width: `${Math.min(100, occupancyRate)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <h3 className="text-base font-bold text-white border-b border-slate-800/80 pb-4">
                Management Modules
              </h3>
              <div className="mt-4 space-y-2.5">
                <Link
                  href={`/properties/${propertyId}/tenants`}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-3 hover:bg-slate-800/60 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Tenant Registry</p>
                      <p className="text-xs text-slate-400">
                        {activeTenants} Active Residents
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </Link>

                <Link
                  href={`/properties/${propertyId}/rent`}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-3 hover:bg-slate-800/60 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Rent Collection</p>
                      <p className="text-xs text-slate-400">
                        {paidCount} Paid / {pendingCount} Pending
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </Link>

                <Link
                  href={`/properties/${propertyId}/expenses`}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-3 hover:bg-slate-800/60 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Expenses & Bills</p>
                      <p className="text-xs text-slate-400">
                        {formatINR(totalExpenses)} this month
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </Link>

                <Link
                  href={`/properties/${propertyId}/reports`}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-3 hover:bg-slate-800/60 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">P&L Financial Reports</p>
                      <p className="text-xs text-slate-400">Annual monthly breakdown</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
