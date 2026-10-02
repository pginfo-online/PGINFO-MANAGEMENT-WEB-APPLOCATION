'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  AlertTriangle,
  Users,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/lib/utils';
import { rentApi } from '../api/rent.api';
import { useToast } from '@/components/ui/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RentRecord, BulkRemindersResponse } from '@/types/rent';

interface BulkReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetRecords: RentRecord[];
  propertyId: string;
  onSuccess?: () => void;
}

export function BulkReminderDialog({
  open,
  onOpenChange,
  targetRecords,
  propertyId,
  onSuccess,
}: BulkReminderDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'all'>('whatsapp');
  const [resultData, setResultData] = useState<BulkRemindersResponse | null>(null);

  // Filter only records that are unpaid
  const eligibleRecords = targetRecords.filter(
    (r) => ['pending', 'overdue', 'partial'].includes(r.status) && (r.totalAmount - r.paidAmount > 0)
  );

  const totalOutstanding = eligibleRecords.reduce(
    (sum, r) => sum + Math.max(0, r.totalAmount - r.paidAmount),
    0
  );

  const sendBulkMutation = useMutation({
    mutationFn: () => {
      const recordIds = eligibleRecords.map((r) => r._id);
      if (recordIds.length === 0) throw new Error('No pending or overdue records to remind.');
      return rentApi.sendBulkReminders(recordIds, channel, 'due_reminder');
    },
    onSuccess: (res) => {
      const data = res.data;
      setResultData(data || null);

      const successful = data?.successful ?? 0;
      const failed = data?.failed ?? 0;

      if (failed === 0) {
        toast.success(
          'Reminders Sent Successfully! 🚀',
          `${successful} WhatsApp reminders dispatched with auto-generated payment links.`
        );
      } else {
        toast.warning(
          'Reminders Dispatched with Warnings',
          `${successful} sent successfully, ${failed} failed or skipped (missing contact).`
        );
      }

      queryClient.invalidateQueries({ queryKey: ['pg-rents', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pg-rent-summary', propertyId] });
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error('Dispatch Failed', err.message || 'Could not send reminders.');
    },
  });

  const handleClose = () => {
    setResultData(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-[var(--border-main)] dark:border-slate-800 text-[var(--text-main)] dark:text-white p-0 overflow-hidden rounded-2xl shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-[var(--border-main)] dark:border-slate-800/80 bg-[var(--bg-card-subtle)] dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[var(--text-main)] dark:text-white">
                Dispatch Rent Reminders
              </DialogTitle>
              <p className="text-xs text-[var(--text-muted)] dark:text-slate-400 mt-0.5">
                Bulk notification via WhatsApp with secure checkout link
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {resultData ? (
            // Results feedback display
            <div className="space-y-4 py-2">
              <div className="rounded-2xl border border-[var(--border-main)] dark:border-slate-800 bg-[var(--bg-card-subtle)] dark:bg-slate-950/60 p-5 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h4 className="text-base font-bold text-[var(--text-main)] dark:text-white">
                  Reminders Processing Complete
                </h4>
                <div className="flex items-center justify-center gap-4 text-xs pt-2">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {resultData.successful} Dispatched
                  </span>
                  {resultData.failed > 0 && (
                    <span className="font-semibold text-rose-500 dark:text-rose-400">
                      {resultData.failed} Failed / Skipped
                    </span>
                  )}
                  <span className="text-[var(--text-muted)] dark:text-slate-400">
                    Total: {resultData.total}
                  </span>
                </div>
              </div>

              <Button
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                onClick={handleClose}
              >
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* Target Summary */}
              <div className="rounded-xl border border-[var(--border-main)] dark:border-slate-800 bg-[var(--bg-card-subtle)] dark:bg-slate-950/60 p-4 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)] dark:text-slate-400">Target Residents:</span>
                  <span className="font-bold text-[var(--text-main)] dark:text-white font-mono">
                    {eligibleRecords.length} {eligibleRecords.length === 1 ? 'resident' : 'residents'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)] dark:text-slate-400">Total Unpaid Dues:</span>
                  <span className="font-mono font-black text-rose-500 dark:text-rose-400 text-sm">
                    {formatINR(totalOutstanding)}
                  </span>
                </div>
              </div>

              {eligibleRecords.length === 0 ? (
                <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4 text-center text-xs text-amber-800 dark:text-amber-300">
                  All residents in this selection are settled in full. No pending dues found!
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <p className="text-[var(--text-sub)] dark:text-slate-300 leading-relaxed">
                    Each resident will receive a personalized reminder with their room details, balance due,
                    and a one-click payment checkout link.
                  </p>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1.5 block">
                      Delivery Channel
                    </label>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as 'whatsapp' | 'email' | 'all')}
                      className="flex h-10 w-full rounded-xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 text-sm text-[var(--text-main)] dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="whatsapp">WhatsApp (Recommended)</option>
                      <option value="email">Email Notification</option>
                      <option value="all">Both WhatsApp & Email</option>
                    </select>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-4 border-t border-[var(--border-main)] dark:border-slate-800/80 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={sendBulkMutation.isPending}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  disabled={sendBulkMutation.isPending || eligibleRecords.length === 0}
                  onClick={() => sendBulkMutation.mutate()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                >
                  {sendBulkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  <span>
                    Send to {eligibleRecords.length} {eligibleRecords.length === 1 ? 'Resident' : 'Residents'}
                  </span>
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
