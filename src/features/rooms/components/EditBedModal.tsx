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
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-[var(--border-main)] dark:border-slate-800 text-[var(--text-main)] dark:text-white shadow-2xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-[var(--border-main)] dark:border-slate-800/80 bg-[var(--bg-card-subtle)] dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 text-sky-700 dark:bg-sky-500/10 dark:border-sky-500/20 dark:text-sky-400">
              <BedDouble className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[var(--text-main)] dark:text-white">
                Edit {bed?.bedLabel ? `Bed ${bed.bedLabel}` : 'Bed'}
              </DialogTitle>
              <p className="text-xs text-[var(--text-muted)] dark:text-slate-400 mt-0.5">
                Update bed availability status, custom rent, or notes
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Bed Status */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1.5 block">
              Bed Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: 'vacant', label: 'Vacant', activeColor: 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-300 font-bold' },
                  { value: 'occupied', label: 'Occupied', activeColor: 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-500/15 dark:border-rose-500/40 dark:text-rose-300 font-bold' },
                  { value: 'maintenance', label: 'Maintenance', activeColor: 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-300 font-bold' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    status === opt.value
                      ? opt.activeColor
                      : 'border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-950/60 text-[var(--text-muted)] dark:text-slate-400 hover:border-[var(--border-strong)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rent Override */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              Custom Rent Override (₹)
            </label>
            <Input
              type="number"
              placeholder="Leave empty to use room rent"
              value={rentOverride}
              onChange={(e) => setRentOverride(e.target.value)}
              className="bg-white dark:bg-slate-950/60 border-[var(--border-main)] dark:border-slate-800 text-[var(--text-main)] dark:text-white placeholder:text-slate-400 focus-visible:ring-[var(--gold)] dark:focus-visible:ring-sky-500 rounded-xl font-mono"
            />
            <p className="mt-1 text-[11px] text-[var(--text-muted)] dark:text-slate-500">
              Optional special rate for this individual bed
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              Notes / Description
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Near the window, repaired switchboard on Oct 1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-950/60 p-3 text-sm text-[var(--text-main)] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50 focus:border-[var(--gold)] dark:focus:ring-sky-500/50 dark:focus:border-sky-500 resize-none transition-all"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-[var(--border-main)] dark:border-slate-800/80 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[var(--border-main)] dark:border-slate-800 text-[var(--text-muted)] dark:text-slate-400 hover:text-[var(--text-main)] hover:bg-[var(--bg-card-subtle)] dark:hover:text-white dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-sky-600 hover:bg-sky-700 dark:hover:bg-sky-500 text-white font-semibold rounded-xl shadow-sm"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
