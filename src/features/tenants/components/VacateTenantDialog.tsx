'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserX, AlertTriangle, Shield, BedDouble } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import type { Tenant, VacateTenantPayload } from '@/types/tenant';

interface VacateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
  onSubmit: (id: string, payload: VacateTenantPayload) => Promise<void> | void;
  isPending?: boolean;
}

export function VacateTenantDialog({
  open,
  onOpenChange,
  tenant,
  onSubmit,
  isPending = false,
}: VacateTenantDialogProps) {
  const [actualLeaveDate, setActualLeaveDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [refundDeposit, setRefundDeposit] = useState(true);

  useEffect(() => {
    if (open) {
      setActualLeaveDate(new Date().toISOString().split('T')[0]);
      setRefundDeposit(true);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    await onSubmit(tenant._id, {
      actualLeaveDate: new Date(actualLeaveDate).toISOString(),
      refundDeposit,
    });
  };

  if (!tenant) return null;

  const roomObj = typeof tenant.room === 'object' ? tenant.room : null;
  const bedObj = typeof tenant.bed === 'object' ? tenant.bed : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl p-0 overflow-hidden shadow-2xl">
        <div className="border-b border-[var(--line)] p-5 bg-[var(--card-subtle)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-[var(--ink)]">
                Vacate Resident
              </DialogTitle>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {tenant.name}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              Vacating will update this resident&apos;s status to <strong>Vacated</strong>.
              {bedObj && (
                <span>
                  {' '}Bed <strong>{bedObj.bedLabel}</strong> in Room{' '}
                  <strong>{roomObj?.roomNumber}</strong> will immediately become vacant and available for re-assignment.
                </span>
              )}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
              Move-out / Vacate Date
            </label>
            <Input
              type="date"
              value={actualLeaveDate}
              onChange={(e) => setActualLeaveDate(e.target.value)}
              required
            />
          </div>

          {tenant.securityDeposit > 0 && (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--card-subtle)] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--muted)] flex items-center gap-1.5 font-medium">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  Security Deposit Held:
                </span>
                <span className="font-mono font-bold text-[var(--ink)]">
                  {formatINR(tenant.securityDeposit)}
                </span>
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs text-[var(--ink)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={refundDeposit}
                  onChange={(e) => setRefundDeposit(e.target.checked)}
                  className="rounded border-[var(--line)] text-emerald-600 focus:ring-emerald-500"
                />
                <span>Refund security deposit upon move-out</span>
              </label>
            </div>
          )}

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
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Confirm & Vacate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
