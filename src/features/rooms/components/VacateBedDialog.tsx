'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut, User } from 'lucide-react';
import type { Bed } from '@/types/property';

interface VacateBedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bed: Bed | null;
  onConfirm: () => Promise<void> | void;
  isPending: boolean;
}

export function VacateBedDialog({
  open,
  onOpenChange,
  bed,
  onConfirm,
  isPending,
}: VacateBedDialogProps) {
  if (!bed) return null;

  const occupant = (bed.currentTenant || bed.tenant) as
    | { name?: string; phone?: string }
    | undefined;
  const occupantName = occupant?.name || 'Resident';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-white shadow-2xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-800/80 bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Vacate Resident
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Confirm check-out and vacate bed
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to vacate{' '}
            <span className="font-semibold text-white">
              {bed.bedLabel ? `Bed ${bed.bedLabel}` : 'this bed'}
            </span>
            ?
          </p>

          {occupant && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{occupantName}</p>
                {occupant.phone && (
                  <p className="text-xs text-slate-400 font-mono">{occupant.phone}</p>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400">
            This will mark the bed as <span className="font-medium text-emerald-400">Vacant</span>, making it available for assignment to new residents.
          </p>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-950/40 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {isPending ? 'Vacating...' : 'Vacate Bed'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
