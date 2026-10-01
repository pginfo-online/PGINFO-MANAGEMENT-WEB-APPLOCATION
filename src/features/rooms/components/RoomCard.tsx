'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
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
import { Badge } from '@/components/ui/badge';
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
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
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
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    if (occupiedBeds > 0) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDelete?.(room._id, room.roomNumber);
    setConfirmDelete(false);
  }, [confirmDelete, occupiedBeds, onDelete, room._id, room.roomNumber]);

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border bg-slate-900/70 backdrop-blur-md shadow-xl transition-all duration-200 hover:shadow-emerald-500/5 hover:-translate-y-0.5 ${
        isFull
          ? 'border-rose-500/25 hover:border-rose-500/40'
          : isVacant
          ? 'border-emerald-500/25 hover:border-emerald-500/40'
          : 'border-amber-500/25 hover:border-amber-500/40'
      }`}
    >
      {/* ─── Card Header ───────────────────────────────────── */}
      <div className="p-4 pb-3 border-b border-slate-800/60">
        <div className="flex items-start justify-between gap-3">
          {/* Room Number Badge */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-white font-black font-mono text-sm">
              {room.roomNumber}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-slate-200 capitalize">
                  {room.shareType} Sharing
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">{floorLabel}</span>
              </div>
              <p className="text-xs font-bold text-emerald-400 mt-0.5">
                {formatINR(roomRent)} / bed
              </p>
            </div>
          </div>

          {/* Occupancy Badge */}
          <div
            className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold border ${
              isFull
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                : isVacant
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            }`}
          >
            {isFull ? 'Full' : isVacant ? 'Vacant' : `${vacantBeds} Open`}
          </div>
        </div>

        {/* Amenity Pills */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {room.acIncluded && (
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-400">
              <Wind className="h-2.5 w-2.5" /> AC
            </span>
          )}
          {(room.attachedBathroom || room.bathroomType === 'attached') && (
            <span className="inline-flex items-center gap-1 rounded-md bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 text-[10px] font-semibold text-teal-400">
              <Bath className="h-2.5 w-2.5" /> Attached Bath
            </span>
          )}
          {room.hasMeter && (
            <span className="inline-flex items-center gap-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
              <Zap className="h-2.5 w-2.5" /> Sub-Meter
            </span>
          )}
        </div>
      </div>

      {/* ─── Bed Allocation Map ────────────────────────────── */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Bed Inventory
          </p>
          <span className="text-[10px] text-slate-500">
            {occupiedBeds}/{totalBeds} occupied
          </span>
        </div>

        <BedMinimap beds={beds} totalBeds={totalBeds} />

        {/* Occupancy Progress */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
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
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-800/60 px-4 py-3">
        {/* Delete Button */}
        <button
          onClick={handleDeleteClick}
          disabled={occupiedBeds > 0 || deleting}
          title={
            occupiedBeds > 0
              ? 'Cannot delete occupied room'
              : confirmDelete
              ? 'Click again to confirm delete'
              : 'Delete empty room'
          }
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
            occupiedBeds > 0
              ? 'text-slate-700 cursor-not-allowed'
              : confirmDelete
              ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400 animate-pulse'
              : 'text-slate-500 hover:bg-slate-800 hover:text-rose-400'
          }`}
        >
          {confirmDelete ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Add Tenant & View Detail */}
        <div className="flex items-center gap-2">
          {!isFull && (
            <Link
              href={`/properties/${propertyId}/tenants/new?roomId=${room._id}`}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              <UserPlus className="h-3 w-3" />
              Add Tenant
            </Link>
          )}
          <Link
            href={`/properties/${propertyId}/rooms/${room._id}`}
            className="flex items-center gap-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
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
