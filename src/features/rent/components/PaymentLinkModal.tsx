'use client';

import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Clock,
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
import { Badge } from '@/components/ui/badge';
import { formatINR, formatMonthYear } from '@/lib/utils';
import { rentApi } from '../api/rent.api';
import { buildWhatsAppMessage, openWhatsAppShare, copyToClipboard } from '../utils/whatsappHelper';
import { useToast } from '@/components/ui/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RentRecord } from '@/types/rent';

interface PaymentLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: RentRecord | null;
  propertyId: string;
}

export function PaymentLinkModal({
  open,
  onOpenChange,
  record,
  propertyId,
}: PaymentLinkModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // Extract link string from record (can be string or object)
  const existingLink =
    typeof record?.paymentLink === 'string'
      ? record.paymentLink
      : typeof record?.paymentLink === 'object' && record?.paymentLink?.shortUrl
      ? record.paymentLink.shortUrl
      : '';

  const balance = record ? Math.max(0, record.totalAmount - record.paidAmount) : 0;
  const isPaid = record?.status === 'paid' || balance === 0;

  // Generate Payment Link Mutation
  const createLinkMutation = useMutation({
    mutationFn: () => {
      if (!record) throw new Error('No record selected');
      return rentApi.createPaymentLink(record._id);
    },
    onSuccess: (res) => {
      const link = res.data?.paymentLink;
      toast.success('Payment Link Generated! 🎉', 'You can now copy and share this link with the resident.');
      queryClient.invalidateQueries({ queryKey: ['pg-rents', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['rent-record', record?._id] });
    },
    onError: (err: Error) => {
      toast.error('Failed to generate payment link', err.message || 'Please check Razorpay configuration.');
    },
  });

  // Verify Status Mutation
  const verifyStatusMutation = useMutation({
    mutationFn: () => {
      if (!record) throw new Error('No record selected');
      return rentApi.verifyPaymentStatus(record._id);
    },
    onSuccess: (res) => {
      const data = res.data;
      if (data?.verified && data?.status === 'paid') {
        toast.success('Payment Verified! 🎉', 'Payment received via gateway and invoice marked as settled.');
        queryClient.invalidateQueries({ queryKey: ['pg-rents', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['pg-rent-summary', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['rent-record', record?._id] });
        queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
        onOpenChange(false);
      } else {
        toast.info('Verification Result', data?.message || `Current invoice status: ${record?.status}`);
      }
    },
    onError: (err: Error) => {
      toast.error('Verification Error', err.message || 'Could not verify payment status with gateway.');
    },
  });

  const activeLink = existingLink || (createLinkMutation.data?.data?.paymentLink as string) || '';

  const handleCopy = async () => {
    if (!activeLink) return;
    const ok = await copyToClipboard(activeLink);
    if (ok) {
      setCopied(true);
      toast.success('Link Copied!', 'Payment link copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    if (!record) return;
    const msg = buildWhatsAppMessage(record.status === 'overdue' ? 'rent_overdue' : 'rent_reminder', {
      tenantName: record.tenant?.name,
      amount: balance,
      roomNumber: record.room?.roomNumber,
      pgName: record.pg?.name,
      dueDate: record.dueDate ? new Date(record.dueDate).toLocaleDateString('en-IN') : undefined,
      paymentUrl: activeLink,
    });

    openWhatsAppShare(record.tenant?.phone, msg);
    toast.success('WhatsApp Opened', 'Payment message ready to send.');
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-[var(--border-main)] dark:border-slate-800 text-[var(--text-main)] dark:text-white p-0 overflow-hidden rounded-2xl shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-[var(--border-main)] dark:border-slate-800/80 bg-[var(--bg-card-subtle)] dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 text-sky-700 dark:bg-sky-500/10 dark:border-sky-500/20 dark:text-sky-400">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[var(--text-main)] dark:text-white">
                Online Rent Payment Link
              </DialogTitle>
              <p className="text-xs text-[var(--text-muted)] dark:text-slate-400 mt-0.5">
                Instant UPI, Cards & NetBanking checkout
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Invoice Summary Pill */}
          <div className="rounded-xl border border-[var(--border-main)] dark:border-slate-800 bg-[var(--bg-card-subtle)] dark:bg-slate-950/60 p-4 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)] dark:text-slate-400">Resident:</span>
              <span className="font-bold text-[var(--text-main)] dark:text-white">
                {record.tenant?.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)] dark:text-slate-400">Billing Period:</span>
              <span className="font-medium text-[var(--text-main)] dark:text-slate-200">
                {formatMonthYear(record.billingMonth, record.billingYear)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-[var(--border-main)] dark:border-slate-800">
              <span className="font-semibold text-[var(--text-main)] dark:text-white">Amount Due:</span>
              <span className="font-mono font-black text-sm text-rose-500 dark:text-rose-400">
                {formatINR(balance)}
              </span>
            </div>
          </div>

          {/* Link status section */}
          {activeLink ? (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 block">
                Razorpay Payment URL
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={activeLink}
                  className="font-mono text-xs bg-slate-50 dark:bg-slate-950/80 border-[var(--border-main)] dark:border-slate-800"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 h-10 px-3"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="ml-1 text-xs">{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 rounded-xl"
                  onClick={handleWhatsAppShare}
                >
                  <MessageCircle className="h-4 w-4 mr-1.5" />
                  Share via WhatsApp
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 text-xs h-10 rounded-xl border-[var(--border-main)] dark:border-slate-800"
                  onClick={() => window.open(activeLink, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Open Checkout
                </Button>
              </div>

              {/* Live Gateway Verification */}
              {!isPaid && (
                <div className="pt-2">
                  <Button
                    variant="subtle"
                    size="sm"
                    className="w-full text-xs h-9 rounded-xl border border-[var(--border-main)] dark:border-slate-800 text-[var(--text-sub)] dark:text-slate-300"
                    onClick={() => verifyStatusMutation.mutate()}
                    disabled={verifyStatusMutation.isPending}
                  >
                    {verifyStatusMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-emerald-500" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                    )}
                    <span>Verify Live Payment Status</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)] dark:text-white">
                  No Payment Link Generated Yet
                </p>
                <p className="text-xs text-[var(--text-muted)] dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Create a secure Razorpay checkout link for ₹{balance.toLocaleString('en-IN')} with automatic payment tracking.
                </p>
              </div>

              <Button
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl h-11"
                onClick={() => createLinkMutation.mutate()}
                disabled={createLinkMutation.isPending || balance <= 0}
              >
                {createLinkMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                <span>Generate Online Payment Link</span>
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-[var(--border-main)] dark:border-slate-800/80 bg-[var(--bg-card-subtle)] dark:bg-slate-950/40">
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
