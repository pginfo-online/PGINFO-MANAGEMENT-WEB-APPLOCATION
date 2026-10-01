'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  BedDouble,
  Wallet,
  ArrowRight,
  TrendingUp,
  MapPin,
  Plus,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { AddPropertyDialog } from '@/features/properties/components/AddPropertyDialog';
import { formatINR } from '@/lib/utils';

export default function MultiPgDashboardPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-dashboard'],
    queryFn: () => dashboardApi.getOwnerDashboard(),
  });

  const dashboard = data?.data;
  const pgs = dashboard?.pgs || [];
  const hasProperties = pgs.length > 0;

  return (
    <DashboardLayout>
      <PageHeader
        title="Multi-PG Overview"
        description="Consolidated portfolio metrics across all your managed properties."
      >
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold shadow-lg shadow-emerald-950/40"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          <span>Add Property</span>
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : error ? (
        <div className="mt-8 rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center text-rose-300">
          Failed to load dashboard metrics. Please check your network or try again.
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Properties"
              value={dashboard?.totalPGs || 0}
              subtitle={`${dashboard?.counts?.activeTenants || 0} active tenants enrolled`}
              icon={<Building2 className="h-5 w-5" />}
              accentColor="emerald"
            />
            <StatCard
              title="Bed Occupancy"
              value={`${dashboard?.occupancy?.occupancyRate || 0}%`}
              subtitle={`${dashboard?.occupancy?.occupiedBeds || 0} occupied of ${dashboard?.occupancy?.totalBeds || 0} beds`}
              icon={<BedDouble className="h-5 w-5" />}
              accentColor="sky"
            />
            <StatCard
              title="Rent Collected (Month)"
              value={formatINR(dashboard?.financials?.totalCollectedThisMonth || 0)}
              subtitle={`Pending: ${formatINR(dashboard?.financials?.totalPendingThisMonth || 0)}`}
              icon={<TrendingUp className="h-5 w-5" />}
              accentColor="emerald"
            />
            <StatCard
              title="Net Operating Profit"
              value={formatINR(dashboard?.financials?.netProfitThisMonth || 0)}
              subtitle={`Expenses: ${formatINR(dashboard?.financials?.totalExpensesThisMonth || 0)}`}
              icon={<Wallet className="h-5 w-5" />}
              accentColor={
                (dashboard?.financials?.netProfitThisMonth || 0) >= 0 ? 'emerald' : 'rose'
              }
            />
          </div>

          {/* Properties Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Your Managed Properties</h2>
                <p className="text-xs text-slate-400">
                  Select a property to manage rooms, tenants, collections, and expenses.
                </p>
              </div>

              {hasProperties && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  className="hidden sm:inline-flex border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                  <span>Add Property</span>
                </Button>
              )}
            </div>

            {hasProperties ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pgs.map((pg) => (
                  <div
                    key={pg._id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-slate-900/90 shadow-xl"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <Badge variant="default" dot>
                          Active
                        </Badge>
                      </div>

                      <h3 className="mt-4 text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {pg.name}
                      </h3>

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        <span>
                          {pg.area ? `${pg.area}, ` : ''}{pg.city || 'India'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-slate-800/80 pt-4">
                      <Link href={`/properties/${pg._id}`}>
                        <Button className="w-full justify-between group-hover:from-emerald-500 group-hover:to-teal-500">
                          <span>Enter Management</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State matching mobile HomeDashboardScreen */
              <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 sm:p-12 text-center backdrop-blur-md shadow-2xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-950/30">
                  <Building2 className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-xl font-bold text-white">
                  No PG Property Added Yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-400 leading-relaxed">
                  Create your first PG property to start managing rooms, beds, tenants, monthly rent collections, and expenses in one place.
                </p>

                {/* Onboarding Highlights */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-700/60">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    Quick 2-min Setup
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-700/60">
                    <MapPin className="h-3.5 w-3.5 text-sky-400" />
                    Google Maps Precision
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-700/60">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    Automated Collections
                  </span>
                </div>

                {/* Action CTA */}
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold px-6 shadow-xl shadow-emerald-950/50"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    <span>Add New Property</span>
                  </Button>
                  <Link href="/properties/new">
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white">
                      <span>Full Page Wizard</span>
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      <AddPropertyDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </DashboardLayout>
  );
}
