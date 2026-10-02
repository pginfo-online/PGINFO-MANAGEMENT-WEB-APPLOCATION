'use client';

import React from 'react';
import { Hourglass, LogOut, ArrowRight, X } from 'lucide-react';
import type { TenantListStats } from '@/types/tenant';

interface TenantActionRowsProps {
  stats: TenantListStats;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function TenantActionRows({
  stats,
  activeFilter,
  onFilterChange,
}: TenantActionRowsProps) {
  const isWaitingActive = activeFilter === 'waiting_to_move' || activeFilter === 'pending';
  const isMovedOutActive = activeFilter === 'moved_out' || activeFilter === 'vacated';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Row 1: Tenants Waiting to Move */}
      <div
        className={`flex items-center justify-between rounded-xl p-3.5 px-4.5 border transition-all duration-200 ${
          isWaitingActive
            ? 'border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-950/20 ring-1 ring-emerald-500/30'
            : 'border-[var(--line)] bg-[var(--card)] hover:border-emerald-500/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Hourglass className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--ink)]">
              Tenants Waiting to Move
            </span>
            <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
              ({stats.waitingToMove ?? 0})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onFilterChange(isWaitingActive ? 'all' : 'waiting_to_move')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            isWaitingActive
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
          }`}
        >
          <span>{isWaitingActive ? 'Clear' : 'View'}</span>
          {isWaitingActive ? <X className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
        </button>
      </div>

      {/* Row 2: Moved Out Tenants */}
      <div
        className={`flex items-center justify-between rounded-xl p-3.5 px-4.5 border transition-all duration-200 ${
          isMovedOutActive
            ? 'border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-950/20 ring-1 ring-emerald-500/30'
            : 'border-[var(--line)] bg-[var(--card)] hover:border-emerald-500/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <LogOut className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--ink)]">
              Moved Out Tenants
            </span>
            <span className="ml-2 font-semibold text-[var(--muted)] font-mono text-sm">
              ({stats.movedOut ?? 0})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onFilterChange(isMovedOutActive ? 'all' : 'moved_out')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            isMovedOutActive
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
          }`}
        >
          <span>{isMovedOutActive ? 'Clear' : 'View'}</span>
          {isMovedOutActive ? <X className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}
