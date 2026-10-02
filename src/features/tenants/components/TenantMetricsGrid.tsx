'use client';

import React from 'react';
import { Users, AlertCircle, Clock, Sparkles } from 'lucide-react';
import type { TenantListStats } from '@/types/tenant';

interface TenantMetricsGridProps {
  stats: TenantListStats;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onPendingDueClick?: () => void;
}

export function TenantMetricsGrid({
  stats,
  activeFilter,
  onFilterChange,
  onPendingDueClick,
}: TenantMetricsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* Card 1: Total Tenants */}
      <button
        type="button"
        onClick={() => onFilterChange('all')}
        className={`group relative text-left rounded-2xl p-4 sm:p-5 transition-all duration-200 border cursor-pointer ${
          activeFilter === 'all'
            ? 'border-emerald-500/50 bg-emerald-500/5 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/30'
            : 'border-[var(--line)] bg-[var(--card)] hover:border-emerald-500/30 hover:bg-[var(--card-subtle)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Total Tenants
          </span>
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Users className="h-3 w-3" />
            Total
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
            {stats.totalTenants ?? 0}
          </span>
          <span className="text-xs text-[var(--muted)] font-medium">Residents</span>
        </div>
      </button>

      {/* Card 2: Pending Due */}
      <button
        type="button"
        onClick={() => {
          if (onPendingDueClick) onPendingDueClick();
        }}
        className={`group relative text-left rounded-2xl p-4 sm:p-5 transition-all duration-200 border cursor-pointer ${
          stats.pendingDue > 0
            ? 'border-rose-500/40 bg-rose-500/5 hover:border-rose-500/60 hover:bg-rose-500/10'
            : 'border-[var(--line)] bg-[var(--card)] hover:border-[var(--line-strong)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Pending Due
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold border ${
              stats.pendingDue > 0
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : 'bg-[var(--line)] text-[var(--muted)] border-[var(--line-strong)]'
            }`}
          >
            <AlertCircle className="h-3 w-3" />
            {stats.pendingDue > 0 ? 'Alert' : 'Clear'}
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              stats.pendingDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--ink)]'
            }`}
          >
            {stats.pendingDue ?? 0}
          </span>
          <span className="text-xs text-[var(--muted)] font-medium">Invoices</span>
        </div>
      </button>

      {/* Card 3: Under Notice */}
      <button
        type="button"
        onClick={() => onFilterChange(activeFilter === 'notice' ? 'all' : 'notice')}
        className={`group relative text-left rounded-2xl p-4 sm:p-5 transition-all duration-200 border cursor-pointer ${
          activeFilter === 'notice'
            ? 'border-amber-500/50 bg-amber-500/10 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/30'
            : 'border-[var(--line)] bg-[var(--card)] hover:border-amber-500/30 hover:bg-[var(--card-subtle)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Under Notice
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold border ${
              stats.underNotice > 0
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-[var(--line)] text-[var(--muted)] border-[var(--line-strong)]'
            }`}
          >
            <Clock className="h-3 w-3" />
            {stats.underNotice > 0 ? 'Notice' : 'None'}
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              stats.underNotice > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--ink)]'
            }`}
          >
            {stats.underNotice ?? 0}
          </span>
          <span className="text-xs text-[var(--muted)] font-medium">Leaving Soon</span>
        </div>
      </button>

      {/* Card 4: Today Booking */}
      <button
        type="button"
        onClick={() =>
          onFilterChange(activeFilter === 'waiting_to_move' ? 'all' : 'waiting_to_move')
        }
        className={`group relative text-left rounded-2xl p-4 sm:p-5 transition-all duration-200 border cursor-pointer ${
          activeFilter === 'waiting_to_move'
            ? 'border-emerald-500/50 bg-emerald-500/10 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/30'
            : 'border-[var(--line)] bg-[var(--card)] hover:border-emerald-500/30 hover:bg-[var(--card-subtle)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Today Booking
          </span>
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Sparkles className="h-3 w-3" />
            New
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
            {stats.todayBooking ?? 0}
          </span>
          <span className="text-xs text-[var(--muted)] font-medium">Bookings</span>
        </div>
      </button>
    </div>
  );
}
