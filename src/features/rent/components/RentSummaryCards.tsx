'use client';

import React, { useMemo } from 'react';
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { RentRecord, RentSummary } from '@/types/rent';

interface RentSummaryCardsProps {
  summary?: RentSummary | null;
  records: RentRecord[];
  isLoading?: boolean;
  onFilterOverdue?: () => void;
}

export function RentSummaryCards({
  summary,
  records,
  isLoading = false,
  onFilterOverdue,
}: RentSummaryCardsProps) {
  // Defensive computation from records to guarantee stats never show 0 when data exists
  const computedStats = useMemo(() => {
    let due = 0;
    let paid = 0;
    let overdue = 0;
    let pending = 0;
    let paidCnt = 0;
    let overdueBalance = 0;

    records.forEach((r) => {
      const tot = Number(r.totalAmount) || Number(r.rentAmount) || 0;
      const p = Number(r.paidAmount) || 0;
      const bal = Math.max(0, tot - p);

      due += tot;
      paid += p;

      if (r.status === 'overdue') {
        overdue += 1;
        overdueBalance += bal;
      } else if (r.status === 'paid' || bal === 0) {
        paidCnt += 1;
      } else {
        pending += 1;
      }
    });

    return {
      due,
      paid,
      overdue,
      pending,
      paidCnt,
      overdueBalance,
      count: records.length,
    };
  }, [records]);

  // Aggregate metrics supporting backend & frontend property names
  const totalBilled =
    summary?.totalDue !== undefined && summary?.totalDue !== null
      ? Number(summary.totalDue)
      : summary?.totalExpected !== undefined && summary?.totalExpected !== null
      ? Number(summary.totalExpected)
      : computedStats.due;

  const totalCollected =
    summary?.totalCollected !== undefined && summary?.totalCollected !== null
      ? Number(summary.totalCollected)
      : computedStats.paid;

  const totalPending =
    summary?.totalOutstanding !== undefined && summary?.totalOutstanding !== null
      ? Number(summary.totalOutstanding)
      : summary?.totalPending !== undefined && summary?.totalPending !== null
      ? Number(summary.totalPending)
      : Math.max(0, totalBilled - totalCollected);

  const overdueCount =
    summary?.overdueCount !== undefined && summary?.overdueCount !== null
      ? Number(summary.overdueCount)
      : computedStats.overdue;

  const paidCount =
    summary?.paidCount !== undefined && summary?.paidCount !== null
      ? Number(summary.paidCount)
      : computedStats.paidCnt;

  const pendingCount =
    summary?.pendingCount !== undefined && summary?.pendingCount !== null
      ? Number(summary.pendingCount)
      : computedStats.pending;

  const collectionRate =
    totalBilled > 0 ? Math.min(100, Math.round((totalCollected / totalBilled) * 100)) : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--border-main)] dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-32 rounded-lg" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Billed / Expected */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-main)] dark:border-slate-800/80 bg-white dark:bg-slate-900/80 p-5 shadow-sm transition-all hover:shadow-md hover:border-sky-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] dark:text-slate-400">
            Total Billed
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 dark:text-sky-400">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-black tracking-tight text-[var(--text-main)] dark:text-white font-mono">
            {formatINR(totalBilled)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)] dark:text-slate-400">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/20">
              {records.length} records
            </span>
            <span>in current selection</span>
          </div>
        </div>
      </div>

      {/* 2. Total Collected */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-main)] dark:border-slate-800/80 bg-white dark:bg-slate-900/80 p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] dark:text-slate-400">
            Total Collected
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
            {formatINR(totalCollected)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] dark:text-slate-400">
              {paidCount} settled in full
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3 inline" />
              {collectionRate}% rate
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${collectionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Total Pending */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-main)] dark:border-slate-800/80 bg-white dark:bg-slate-900/80 p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] dark:text-slate-400">
            Outstanding Due
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400 font-mono">
            {formatINR(totalPending)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)] dark:text-slate-400">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
              {pendingCount} pending
            </span>
            <span>awaiting payment</span>
          </div>
        </div>
      </div>

      {/* 4. Overdue Balance & Alerts */}
      <div
        onClick={onFilterOverdue}
        className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all cursor-pointer ${
          overdueCount > 0
            ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-400 dark:hover:border-rose-500/60'
            : 'border-[var(--border-main)] dark:border-slate-800/80 bg-white dark:bg-slate-900/80 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] dark:text-slate-400">
            Overdue Invoices
          </span>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
              overdueCount > 0
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3">
          <div
            className={`text-2xl font-black tracking-tight font-mono ${
              overdueCount > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-[var(--text-main)] dark:text-white'
            }`}
          >
            {overdueCount} {overdueCount === 1 ? 'Notice' : 'Notices'}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] dark:text-slate-400">
              {overdueCount > 0 ? 'Requires immediate action' : 'Zero overdue payments'}
            </span>
            {overdueCount > 0 && (
              <span className="font-semibold text-rose-600 dark:text-rose-400 text-[11px] underline">
                View & Remind
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
