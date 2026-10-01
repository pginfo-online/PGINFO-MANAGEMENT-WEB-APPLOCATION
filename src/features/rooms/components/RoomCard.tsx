'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BedDouble,
  ChevronRight,
  Zap,
  Wind,
  Bath,
  Trash2,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import type { Room, Bed } from '@/types/property';

interface RoomCardProps {
  room: Room;
  propertyId: string;
  fallbackRent?: number;
  onDelete?: (roomId: string, roomNumber: string) => void;
  deleting?: boolean;
}

// ─── Bed Allocation Minimap ─────────────────────────────────────────────────

function BedMinimap({ beds, totalBeds }: { beds: Bed[]; totalBeds: number }) {
  const count = Math.max(totalBeds, beds.length, 1);
  const items = Array.from({ length: count }, (_, i) => {
    const bed = beds[i];
    const isOccupied = bed
      ? bed.status === 'occupied' || (bed as unknown as { isOccupied?: boolean }).isOccupied
      : false;
    const rawLabel = String(bed?.bedLabel || i + 1).trim();
    const bedLabel = rawLabel.toLowerCase().startsWith('bed') ? rawLabel : `Bed ${rawLabel}`;
    return { isOccupied, label: bedLabel, shortLabel: rawLabel };
  });

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {items.map((item, i) => (
        <div
          key={i}
          title={`${item.label} — ${item.isOccupied ? 'Occupied' : 'Vacant'}`}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold border transition-all ${
            item.isOccupied
              ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400'
          }`}
        >
          {item.shortLabel}
        </div>
      ))}
    </div>
  );
}

// ─── Room Card ──────────────────────────────────────────────────────────────

export function RoomCard({ room, propertyId, fallbackRent, onDelete, deleting }: RoomCardProps) {
  const beds: Bed[] = room.beds || [];
  const totalBeds = room.totalBeds || beds.length || 1;
  const occupiedBeds = room.occupiedBeds ?? beds.filter((b) => b.status === 'occupied' || (b as unknown as { isOccupied?: boolean }).isOccupied).length;
  const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
  const isFull = occupiedBeds >= totalBeds;
  const isVacant = occupiedBeds === 0;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const roomRent = Number(room.rentPerBed) || Number(room.rent) || fallbackRent || 0;

  const floorLabel = room.floorLabel
    ? room.floorLabel.charAt(0).toUpperCase() + room.floorLabel.slice(1) + ' Floor'
    : 'Ground Floor';

  const handleDeleteClick = useCallback(() => {
    if (occupiedBeds > 0 || deleting) return;
    onDelete?.(room._id, room.roomNumber);
  }, [occupiedBeds, deleting, onDelete, room._id, room.roomNumber]);

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border bg-white dark:bg-slate-900/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden ${
        isFull
          ? 'border-rose-200 dark:border-rose-500/25 hover:border-rose-300 dark:hover:border-rose-500/40'
          : isVacant
          ? 'border-emerald-200 dark:border-emerald-500/25 hover:border-emerald-300 dark:hover:border-emerald-500/40'
          : 'border-amber-200 dark:border-amber-500/25 hover:border-amber-300 dark:hover:border-amber-500/40'
      }`}
    >
      {/* ─── Room Photo Banner (if available) ─── */}
      {room.image && (
        <div className="relative h-32 w-full overflow-hidden border-b border-[var(--border-main)] dark:border-slate-800 bg-slate-950">
          <Image
            src={room.image}
            alt={`Room ${room.roomNumber}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 360px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        </div>
      )}

      {/* ─── Card Header ───────────────────────────────────── */}
      <div className="p-4 pb-3 border-b border-[var(--border-main)] dark:border-slate-800/60">
        <div className="flex items-start justify-between gap-3">
          {/* Room Number Badge */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--gold-pale)] dark:bg-slate-800 border border-[var(--gold-light)] dark:border-slate-700 text-[var(--gold-strong)] dark:text-white font-black font-mono text-sm shadow-sm">
              {room.roomNumber}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-[var(--text-main)] dark:text-slate-200 capitalize">
                  {room.shareType} Sharing
                </span>
                <span className="text-slate-400 dark:text-slate-600">·</span>
                <span className="text-xs text-[var(--text-muted)] dark:text-slate-400">{floorLabel}</span>
              </div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {formatINR(roomRent)} / bed
              </p>
            </div>
          </div>

          {/* Occupancy Badge */}
          <div
            className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold border ${
              isFull
                ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300'
                : isVacant
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300'
                : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300'
            }`}
          >
            {isFull ? 'Full' : isVacant ? 'Vacant' : `${vacantBeds} Open`}
          </div>
        </div>

        {/* Amenity Pills */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {room.acIncluded && (
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-400">
              <Wind className="h-2.5 w-2.5" /> AC
            </span>
          )}
          {(room.attachedBathroom || room.bathroomType === 'attached') && (
            <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 px-2 py-0.5 text-[10px] font-semibold text-teal-700 dark:text-teal-400">
              <Bath className="h-2.5 w-2.5" /> Attached Bath
            </span>
          )}
          {room.hasMeter && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-yellow-500/10 border border-amber-200 dark:border-yellow-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-yellow-400">
              <Zap className="h-2.5 w-2.5" /> Sub-Meter
            </span>
          )}
        </div>
      </div>

      {/* ─── Bed Allocation Map ────────────────────────────── */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] dark:text-slate-400">
            Bed Inventory
          </p>
          <span className="text-[10px] text-[var(--text-muted)] dark:text-slate-500">
            {occupiedBeds}/{totalBeds} occupied
          </span>
        </div>

        <BedMinimap beds={beds} totalBeds={totalBeds} />

        {/* Occupancy Progress */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFull
                ? 'bg-gradient-to-r from-rose-500 to-rose-400'
                : isVacant
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-amber-500 to-yellow-400'
            }`}
            style={{ width: `${occupancyRate}%` }}
          />
        </div>
      </div>

      {/* ─── Card Footer ───────────────────────────────────── */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--border-main)] dark:border-slate-800/60 px-4 py-3 bg-[var(--bg-card-subtle)] dark:bg-transparent">
        {/* Delete Button */}
        <button
          onClick={handleDeleteClick}
          disabled={occupiedBeds > 0 || deleting}
          title={
            occupiedBeds > 0
              ? 'Cannot delete room with occupied beds'
              : deleting
              ? 'Deleting...'
              : 'Delete room'
          }
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
            occupiedBeds > 0
              ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40'
              : 'text-[var(--text-muted)] hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400'
          }`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        {/* Add Tenant & View Detail */}
        <div className="flex items-center gap-2">
          {!isFull && (
            <Link
              href={`/properties/${propertyId}/tenants/new?roomId=${room._id}`}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/25 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-all shadow-sm"
            >
              <UserPlus className="h-3 w-3" />
              Add Tenant
            </Link>
          )}
          <Link
            href={`/properties/${propertyId}/rooms/${room._id}`}
            className="flex items-center gap-1 rounded-lg bg-white dark:bg-slate-800 border border-[var(--border-main)] dark:border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-[var(--text-main)] dark:text-slate-300 hover:bg-[var(--border-main)] dark:hover:bg-slate-700 dark:hover:text-white transition-all shadow-sm"
          >
            <BedDouble className="h-3 w-3" />
            Detail
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
