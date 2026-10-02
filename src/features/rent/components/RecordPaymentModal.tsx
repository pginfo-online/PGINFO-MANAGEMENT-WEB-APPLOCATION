'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Wallet,
  IndianRupee,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatINR, formatMonthYear } from '@/lib/utils';
import { rentApi } from '../api/rent.api';
import { useToast } from '@/components/ui/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RentRecord, PaymentMethod, MarkRentPaidRequest } from '@/types/rent';

interface RecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: RentRecord | null;
  propertyId: string;
}

export function RecordPaymentModal({
  open,
  onOpenChange,
  record,
  propertyId,
}: RecordPaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const balance = record ? Math.max(0, record.totalAmount - record.paidAmount) : 0;

  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('upi');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  // Default to full balance whenever record changes
  useEffect(() => {
    if (record && balance > 0) {
      setPayAmount(String(balance));
      setValidationError('');
    }
  }, [record, balance]);

  const markPaidMutation = useMutation({
    mutationFn: (payload: MarkRentPaidRequest) => {
      if (!record) throw new Error('No rent record selected');
      return rentApi.markRentPaid(record._id, payload);
    },
    onSuccess: (res) => {
      const num = parseFloat(payAmount);
      toast.success(
        'Payment Recorded! 🎉',
        `Payment of ${formatINR(num)} recorded successfully for ${record?.tenant?.name}. Receipt generated.`
      );
      queryClient.invalidateQueries({ queryKey: ['pg-rents', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pg-rent-summary', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['rent-record', record?._id] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
      onOpenChange(false);
      setPayReference('');
      setPayNotes('');
    },
    onError: (err: Error) => {
      toast.error('Failed to Record Payment', err.message || 'Please check your inputs.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    const numAmount = parseFloat(payAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setValidationError('Please enter a valid payment amount greater than ₹0.');
      return;
    }
    if (numAmount > balance + 0.01) {
      setValidationError(`Amount cannot exceed the remaining due balance of ${formatINR(balance)}.`);
      return;
    }

    setValidationError('');
    markPaidMutation.mutate({
      amount: numAmount,
      method: payMethod,
      reference: payReference.trim() || undefined,
      notes: payNotes.trim() || undefined,
    });
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-[var(--border-main)] dark:border-slate-800 text-[var(--text-main)] dark:text-white p-0 overflow-hidden rounded-2xl shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-[var(--border-main)] dark:border-slate-800/80 bg-[var(--bg-card-subtle)] dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[var(--text-main)] dark:text-white">
                Record Payment
              </DialogTitle>
              <p className="text-xs text-[var(--text-muted)] dark:text-slate-400 mt-0.5">
                Manual entry for cash, UPI, or direct transfers
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Resident Details Banner */}
          <div className="rounded-xl border border-[var(--border-main)] dark:border-slate-800 bg-[var(--bg-card-subtle)] dark:bg-slate-950/60 p-3.5 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)] dark:text-slate-400">Resident:</span>
              <span className="font-bold text-[var(--text-main)] dark:text-white">
                {record.tenant?.name}{' '}
                {record.room ? `(Room ${record.room.roomNumber})` : ''}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)] dark:text-slate-400">Billing Period:</span>
              <span className="font-medium text-[var(--text-main)] dark:text-slate-200">
                {formatMonthYear(record.billingMonth, record.billingYear)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-[var(--border-main)] dark:border-slate-800">
              <span className="font-semibold text-[var(--text-main)] dark:text-white">
                Remaining Balance:
              </span>
              <span className="font-mono font-black text-rose-500 dark:text-rose-400 text-sm">
                {formatINR(balance)}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400">
                Amount Received (₹) *
              </label>
              {balance > 0 && (
                <button
                  type="button"
                  onClick={() => setPayAmount(String(balance))}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Pay Full ({formatINR(balance)})
                </button>
              )}
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <IndianRupee className="h-4 w-4" />
              </div>
              <Input
                type="number"
                step="any"
                min="1"
                max={balance}
                required
                value={payAmount}
                onChange={(e) => {
                  setPayAmount(e.target.value);
                  setValidationError('');
                }}
                placeholder="0"
                className="pl-9 font-mono text-base font-bold bg-white dark:bg-slate-950/80 border-[var(--border-main)] dark:border-slate-800 text-[var(--text-main)] dark:text-white"
              />
            </div>
            {validationError && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 inline shrink-0" />
                {validationError}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1 block">
              Payment Method *
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
              className="flex h-10 w-full rounded-xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 text-sm text-[var(--text-main)] dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
              <option value="cash">Cash in Hand</option>
              <option value="bank_transfer">Direct Bank Transfer / NEFT / IMPS</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online Payment Gateway</option>
              <option value="other">Other / Adjustment</option>
            </select>
          </div>

          {/* Reference ID */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1 block">
              Transaction / UPI Reference ID
            </label>
            <Input
              value={payReference}
              onChange={(e) => setPayReference(e.target.value)}
              placeholder="e.g. 40291823901"
              className="font-mono text-xs bg-white dark:bg-slate-950/80 border-[var(--border-main)] dark:border-slate-800"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1 block">
              Notes / Remarks
            </label>
            <Input
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="Optional remarks (e.g. advance deduction, cash collected by warden)"
              className="text-xs bg-white dark:bg-slate-950/80 border-[var(--border-main)] dark:border-slate-800"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-[var(--border-main)] dark:border-slate-800/80 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={markPaidMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
            >
              {markPaidMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              <span>Record & Settle</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
