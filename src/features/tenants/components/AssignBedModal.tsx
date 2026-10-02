'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BedDouble, Check, Loader2, AlertCircle } from 'lucide-react';
import { usePGRooms } from '@/features/rooms/hooks/useRooms';
import { formatINR } from '@/lib/utils';
import type { Tenant } from '@/types/tenant';
import type { Room, Bed } from '@/types/property';

interface AssignBedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
  propertyId: string;
  onSubmit: (tenantId: string, bedId: string) => Promise<void> | void;
  isPending?: boolean;
}

export function AssignBedModal({
  open,
  onOpenChange,
  tenant,
  propertyId,
  onSubmit,
  isPending = false,
}: AssignBedModalProps) {
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [error, setError] = useState('');

  const { data: roomsData, isLoading: isLoadingRooms } = usePGRooms(propertyId);
  const rooms: Room[] = useMemo(() => roomsData?.rooms || [], [roomsData]);

  const currentRoomObj = typeof tenant?.room === 'object' ? tenant.room : null;
  const currentBedObj = typeof tenant?.bed === 'object' ? tenant.bed : null;

  const selectedRoom = useMemo(
    () => rooms.find((r) => r._id === selectedRoomId),
    [rooms, selectedRoomId]
  );

  const availableBeds: Bed[] = useMemo(() => {
    if (!selectedRoom) return [];
    return selectedRoom.beds || [];
  }, [selectedRoom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    if (!selectedBedId) {
      setError('Please select an available bed');
      return;
    }

    await onSubmit(tenant._id, selectedBedId);
  };

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl p-0 overflow-hidden shadow-2xl">
        <div className="border-b border-[var(--line)] p-5 bg-[var(--card-subtle)]">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[var(--ink)]">
              {currentBedObj ? 'Change Bed Allocation' : 'Assign Bed to Resident'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-[var(--muted)] mt-1">
            Resident: <strong className="text-[var(--ink)]">{tenant.name}</strong>
            {currentRoomObj && (
              <span> (Currently in Room {currentRoomObj.roomNumber}, Bed {currentBedObj?.bedLabel})</span>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1.5">
              1. Choose Room
            </label>
            {isLoadingRooms ? (
              <div className="flex items-center gap-2 text-xs text-[var(--muted)] p-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                <span>Loading available rooms...</span>
              </div>
            ) : rooms.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">No rooms available.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                {rooms.map((room) => {
                  const isSelected = selectedRoomId === room._id;
                  const beds = room.beds || [];
                  const vacantCount = beds.filter((b) => b.status === 'vacant').length;

                  return (
                    <button
                      key={room._id}
                      type="button"
                      disabled={vacantCount === 0}
                      onClick={() => {
                        setSelectedRoomId(room._id);
                        setSelectedBedId('');
                        setError('');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        vacantCount === 0
                          ? 'opacity-40 border-[var(--line)] bg-[var(--card-subtle)] cursor-not-allowed'
                          : isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                          : 'border-[var(--line)] bg-[var(--card)] hover:border-emerald-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--ink)]">
                          Room {room.roomNumber}
                        </span>
                        {isSelected && <Check className="h-3 w-3 text-emerald-500" />}
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                        {vacantCount} vacant {vacantCount === 1 ? 'bed' : 'beds'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedRoom && (
            <div className="pt-3 border-t border-[var(--line)]">
              <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1.5">
                2. Choose Bed in Room {selectedRoom.roomNumber}
              </label>

              <div className="grid grid-cols-3 gap-2">
                {availableBeds.map((bed) => {
                  const isOccupied = bed.status === 'occupied';
                  const isSelected = selectedBedId === bed._id;

                  return (
                    <button
                      key={bed._id}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => {
                        setSelectedBedId(bed._id);
                        setError('');
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isOccupied
                          ? 'opacity-40 border-[var(--line)] bg-[var(--card-subtle)] cursor-not-allowed'
                          : isSelected
                          ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm'
                          : 'border-[var(--line)] bg-[var(--card)] hover:border-emerald-500/40'
                      }`}
                    >
                      <BedDouble
                        className={`h-4 w-4 mx-auto ${
                          isSelected ? 'text-white' : 'text-emerald-500'
                        }`}
                      />
                      <p
                        className={`text-xs font-bold mt-1 ${
                          isSelected ? 'text-white' : 'text-[var(--ink)]'
                        }`}
                      >
                        {bed.bedLabel}
                      </p>
                      <span
                        className={`text-[9px] uppercase font-semibold ${
                          isOccupied
                            ? 'text-rose-500'
                            : isSelected
                            ? 'text-emerald-100'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isOccupied ? 'Occupied' : 'Vacant'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

          <DialogFooter className="pt-4 border-t border-[var(--line)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isPending}
              disabled={!selectedBedId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Confirm Assignment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
