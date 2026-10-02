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
import { Trash2, AlertCircle } from 'lucide-react';
import type { Tenant } from '@/types/tenant';

interface DeleteTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
  onConfirm: (id: string) => Promise<void> | void;
  isPending?: boolean;
}

export function DeleteTenantDialog({
  open,
  onOpenChange,
  tenant,
  onConfirm,
  isPending = false,
}: DeleteTenantDialogProps) {
  if (!tenant) return null;

  const roomObj = typeof tenant.room === 'object' ? tenant.room : null;
  const bedObj = typeof tenant.bed === 'object' ? tenant.bed : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl p-0 overflow-hidden shadow-2xl">
        <div className="border-b border-[var(--line)] p-5 bg-[var(--card-subtle)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-[var(--ink)]">
                Delete Resident Record
              </DialogTitle>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {tenant.name}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
              Are you sure you want to permanently delete <strong>{tenant.name}</strong>?
              {bedObj && (
                <span>
                  {' '}Bed <strong>{bedObj.bedLabel}</strong> in Room <strong>{roomObj?.roomNumber}</strong> will be freed automatically.
                </span>
              )}
              {' '}This action cannot be undone.
            </p>
          </div>

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
              type="button"
              variant="destructive"
              isLoading={isPending}
              onClick={() => onConfirm(tenant._id)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Delete Resident
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
