'use client';

import React from 'react';
import Link from 'next/link';
import {
  BedDouble,
  User,
  Phone,
  Calendar,
  IndianRupee,
  LogOut,
  Edit2,
  UserPlus,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/lib/utils';
import type { Bed, Room } from '@/types/property';

interface BedCardProps {
  bed: Bed;
  index: number;
  room: Room;
  propertyId: string;
  onAssignClick: (bed: Bed) => void;
  onVacateClick: (bed: Bed) => void;
  onEditClick: (bed: Bed) => void;
}

export function BedCard({
  bed,
  index,
  room,
  propertyId,
  onAssignClick,
  onVacateClick,
  onEditClick,
}: BedCardProps) {
  const isOccupied =
    bed.status === 'occupied' || (bed as unknown as { isOccupied?: boolean }).isOccupied;
  const isMaintenance = bed.status === 'maintenance';

  const rawLabel = String(bed.bedLabel || index + 1).trim();
  const bedLabel = rawLabel.toLowerCase().startsWith('bed')
    ? rawLabel
    : `Bed ${rawLabel}`;

  const hasCustomRent =
    bed.rentOverride !== undefined &&
    bed.rentOverride !== null &&
    Number(bed.rentOverride) > 0;

  const effectiveRent = hasCustomRent
    ? Number(bed.rentOverride)
    : Number(room.rentPerBed) || Number(room.rent) || 0;

  const occupant = (bed.currentTenant || bed.tenant) as
    | { _id?: string; name?: string; phone?: string; checkInDate?: string; joinDate?: string }
    | undefined;

  const occupantName = occupant?.name || (isOccupied ? 'Occupied Resident' : null);
  const occupantPhone = occupant?.phone || '';
  const checkInDate = occupant?.checkInDate || occupant?.joinDate;

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border p-5 transition-all duration-200 shadow-sm hover:shadow-md ${
        isOccupied
          ? 'bg-white dark:bg-slate-900/80 border-[var(--border-main)] dark:border-slate-800 hover:border-[var(--border-strong)] dark:hover:border-slate-700'
          : isMaintenance
          ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-500/20 hover:border-amber-300 dark:hover:border-amber-500/30'
          : 'bg-white dark:bg-slate-900/90 border-[var(--border-main)] dark:border-emerald-500/25 hover:border-emerald-300 dark:hover:border-emerald-500/40'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl border font-mono font-bold text-sm transition-transform group-hover:scale-105 ${
              isOccupied
                ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'
                : isMaintenance
                ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/25 dark:text-emerald-400'
            }`}
          >
            <BedDouble className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[var(--text-main)] dark:text-white flex items-center gap-2">
              <span>{bedLabel}</span>
              {hasCustomRent && (
                <span className="text-[10px] font-semibold text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-full bg-amber-50 dark:text-amber-400 dark:border-amber-500/30 dark:bg-amber-500/10">
                  Custom Rent
                </span>
              )}
            </h4>
            <p className="text-xs text-[var(--text-muted)] dark:text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
              <IndianRupee className="h-3 w-3 text-[var(--text-muted)] dark:text-slate-500" />
              <span className="font-bold text-[var(--text-main)] dark:text-slate-200">{formatINR(effectiveRent)}</span>
              <span className="text-[var(--text-muted)] dark:text-slate-500">/mo</span>
            </p>
          </div>
        </div>

        {/* Status Pill Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
            isOccupied
              ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300'
              : isMaintenance
              ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/25 dark:text-emerald-300'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isOccupied
                ? 'bg-rose-500 animate-pulse'
                : isMaintenance
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
          />
          {isOccupied ? 'Occupied' : isMaintenance ? 'Maintenance' : 'Vacant'}
        </div>
      </div>

      {/* Body Details */}
      <div className="flex-1 space-y-3 py-1">
        {isOccupied ? (
          <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card-subtle)] dark:bg-slate-950/50 dark:border-slate-800/80 p-3.5 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[var(--text-main)] dark:text-white truncate">{occupantName}</p>
                {occupantPhone && (
                  <p className="text-xs text-[var(--text-muted)] dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3 text-[var(--text-muted)] dark:text-slate-500" />
                    {occupantPhone}
                  </p>
                )}
              </div>
            </div>

            {checkInDate && (
              <div className="flex items-center gap-1.5 pt-1.5 border-t border-[var(--border-main)] dark:border-slate-800/60 text-[11px] text-[var(--text-muted)] dark:text-slate-400">
                <Calendar className="h-3 w-3 text-[var(--text-muted)] dark:text-slate-500" />
                <span>Joined: {new Date(checkInDate).toLocaleDateString()}</span>
              </div>
            )}

            {bed.notes && (
              <p className="text-xs text-[var(--text-muted)] dark:text-slate-400 italic pt-1 border-t border-[var(--border-main)] dark:border-slate-800/60">
                &ldquo;{bed.notes}&rdquo;
              </p>
            )}
          </div>
        ) : isMaintenance ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-semibold text-xs">
              <Wrench className="h-3.5 w-3.5" />
              Under Maintenance
            </div>
            <p className="text-xs text-amber-700 dark:text-slate-400">
              {bed.notes || 'This bed is currently offline for maintenance or repairs.'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/15 dark:bg-emerald-500/5 p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Ready for Occupancy
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Bed is ready. You can quick-assign a resident or create a full lease agreement.
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-[var(--border-main)] dark:border-slate-800/80 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEditClick(bed)}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-subtle)] dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 px-2.5 h-8 rounded-lg"
        >
          <Edit2 className="h-3.5 w-3.5 mr-1.5" />
          Edit Bed
        </Button>

        <div className="flex items-center gap-2">
          {isOccupied ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onVacateClick(bed)}
              className="text-xs border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 dark:border-rose-500/30 dark:bg-transparent dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 dark:hover:border-rose-500/50 h-8 rounded-lg shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Vacate
            </Button>
          ) : (
            <>
              <Link
                href={`/properties/${propertyId}/tenants/new?roomId=${room._id}&bedId=${bed._id}`}
                className="hidden sm:inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] px-2 h-8 rounded-lg transition-colors"
                title="Full Onboarding with KYC & Documents"
              >
                Full KYC
              </Link>
              <Button
                type="button"
                size="sm"
                onClick={() => onAssignClick(bed)}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white font-semibold h-8 rounded-lg shadow-sm"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Assign Resident
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
