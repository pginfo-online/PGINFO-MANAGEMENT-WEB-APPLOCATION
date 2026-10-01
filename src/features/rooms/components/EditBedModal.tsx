'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BedDouble, IndianRupee, FileText } from 'lucide-react';
import type { Bed, BedStatus, UpdateBedPayload } from '@/types/property';

interface EditBedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bed: Bed | null;
  onSubmit: (bedId: string, payload: UpdateBedPayload) => Promise<void> | void;
  isPending: boolean;
}

export function EditBedModal({
  open,
  onOpenChange,
  bed,
  onSubmit,
  isPending,
}: EditBedModalProps) {
  const [status, setStatus] = useState<BedStatus>('vacant');
  const [rentOverride, setRentOverride] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (open && bed) {
      setStatus(bed.status || 'vacant');
      setRentOverride(bed.rentOverride !== undefined && bed.rentOverride !== null ? String(bed.rentOverride) : '');
      setNotes(bed.notes || '');
    }
  }, [open, bed]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!bed) return;

      const payload: UpdateBedPayload = {
        status,
        rentOverride: rentOverride.trim() ? parseFloat(rentOverride) : undefined,
        notes: notes.trim() || undefined,
      };

      await onSubmit(bed._id, payload);
    },
    [bed, status, rentOverride, notes, onSubmit]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-white shadow-2xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <BedDouble className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Edit {bed?.bedLabel ? `Bed ${bed.bedLabel}` : 'Bed'}
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Update bed availability status, custom rent, or notes
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Bed Status */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Bed Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: 'vacant', label: 'Vacant', activeColor: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' },
                  { value: 'occupied', label: 'Occupied', activeColor: 'bg-rose-500/15 border-rose-500/40 text-rose-300' },
                  { value: 'maintenance', label: 'Maintenance', activeColor: 'bg-amber-500/15 border-amber-500/40 text-amber-300' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    status === opt.value
                      ? opt.activeColor
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rent Override */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
              Custom Rent Override (₹)
            </label>
            <Input
              type="number"
              placeholder="Leave empty to use room rent"
              value={rentOverride}
              onChange={(e) => setRentOverride(e.target.value)}
              className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-sky-500 rounded-xl font-mono"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Optional special rate for this individual bed
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Notes / Description
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Near the window, repaired switchboard on Oct 1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 resize-none transition-all"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-950/40"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
