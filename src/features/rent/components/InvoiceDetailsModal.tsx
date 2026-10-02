'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  User,
  Phone,
  Building,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  MessageCircle,
  Link2,
  RefreshCw,
  ExternalLink,
  Loader2,
  Receipt,
  Bell,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatINR, formatDate, formatPhone, formatMonthYear, getDaysOverdue } from '@/lib/utils';
import { rentApi } from '../api/rent.api';
import { buildWhatsAppMessage, openWhatsAppShare } from '../utils/whatsappHelper';
import { downloadReceipt } from '../utils/receiptHelper';
import { ReceiptModal } from './ReceiptModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { PaymentLinkModal } from './PaymentLinkModal';
import { useToast } from '@/components/ui/toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RentRecord } from '@/types/rent';

interface InvoiceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rentId: string | null;
  propertyId: string;
}

export function InvoiceDetailsModal({
  open,
  onOpenChange,
  rentId,
  propertyId,
}: InvoiceDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [recordPayOpen, setRecordPayOpen] = useState(false);
  const [paymentLinkOpen, setPaymentLinkOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch single rent record with full details
  const { data: recordData, isLoading, refetch } = useQuery({
    queryKey: ['rent-record', rentId],
    queryFn: () => rentApi.getRentRecord(rentId!),
    enabled: open && !!rentId,
  });

  const record: RentRecord | null = recordData?.data || null;

  // Verify Gateway Status Mutation
  const verifyStatusMutation = useMutation({
    mutationFn: () => rentApi.verifyPaymentStatus(rentId!),
    onSuccess: (res) => {
      const data = res.data;
      if (data?.verified && data?.status === 'paid') {
        toast.success('Payment Verified! 🎉', 'Payment verified settled with gateway.');
        queryClient.invalidateQueries({ queryKey: ['pg-rents', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['pg-rent-summary', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['rent-record', rentId] });
        refetch();
      } else {
        toast.info('Verification Result', data?.message || `Current invoice status: ${record?.status}`);
      }
    },
    onError: (err: Error) => {
      toast.error('Verification Error', err.message || 'Could not verify status with gateway.');
    },
  });

  if (!open) return null;

  const amount = record?.totalAmount || record?.rentAmount || 0;
  const paidAmount = record?.paidAmount || 0;
  const balance = Math.max(0, amount - paidAmount);
  const isPaid = record?.status === 'paid' || balance === 0;
  const daysOverdue = record ? getDaysOverdue(record.dueDate) : 0;
  const isOverdue = record?.status === 'overdue' || (!isPaid && daysOverdue > 0);

  const handleWhatsAppReminder = () => {
    if (!record) return;
    const paymentUrl = typeof record.paymentLink === 'string' ? record.paymentLink : undefined;
    const msg = buildWhatsAppMessage(isOverdue ? 'rent_overdue' : 'rent_reminder', {
      tenantName: record.tenant?.name,
      amount: balance,
      roomNumber: record.room?.roomNumber,
      pgName: record.pg?.name,
      dueDate: record.dueDate ? new Date(record.dueDate).toLocaleDateString('en-IN') : undefined,
      daysOverdue,
      paymentUrl,
    });

    openWhatsAppShare(record.tenant?.phone, msg);
    // Also record audit reminder on backend
    rentApi.sendReminder(record._id, { channel: 'whatsapp', type: isOverdue ? 'overdue' : 'due_reminder' }).catch(() => {});
    toast.success('WhatsApp Opened', 'Payment reminder message generated.');
  };

  const handleDownload = async () => {
    if (!record?.invoiceUrl) {
      toast.error('Download Unavailable', 'Receipt has not been generated for this invoice yet.');
      return;
    }
    setIsDownloading(true);
    try {
      const ok = await downloadReceipt(record.invoiceUrl, record.invoiceNumber || 'RCP');
      if (ok) toast.success('Receipt Downloaded');
      else toast.error('Download Failed');
    } catch {
      toast.error('Download Failed');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[90vh] bg-white dark:bg-slate-900 border border-[var(--border-main)] dark:border-slate-800 text-[var(--text-main)] dark:text-white p-0 overflow-hidden rounded-2xl shadow-2xl flex flex-col">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-[var(--border-main)] dark:border-slate-800/80 bg-[var(--bg-card-subtle)] dark:bg-slate-950/40 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-[var(--text-main)] dark:text-white">
                    Invoice Details
                  </DialogTitle>
                  <p className="text-xs text-[var(--text-muted)] dark:text-slate-400 mt-0.5">
                    {record
                      ? formatMonthYear(record.billingMonth, record.billingYear)
                      : 'Billing breakdown'}
                  </p>
                </div>
              </div>

              {record && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/properties/${propertyId}/rent/${record._id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] dark:text-slate-400 hover:text-[var(--text-main)] dark:hover:text-white"
                  >
                    <span>Full Page</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {isLoading || !record ? (
              <div className="space-y-4">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
              </div>
            ) : (
              <>
                {/* 1. Status & Amount Header Card */}
                <div className="rounded-2xl border border-[var(--border-main)] dark:border-slate-800 bg-[var(--bg-card-subtle)] dark:bg-slate-950/60 p-5 space-y-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-semibold text-[var(--text-muted)] dark:text-slate-400 block uppercase tracking-wider">
                        {formatMonthYear(record.billingMonth, record.billingYear)} Rent
                      </span>
                      <div className="text-3xl font-black text-[var(--text-main)] dark:text-white font-mono mt-1">
                        {formatINR(amount)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={
                          isPaid
                            ? 'default'
                            : isOverdue
                            ? 'destructive'
                            : 'warning'
                        }
                        dot
                        className="text-xs uppercase font-bold"
                      >
                        {isOverdue && !isPaid ? 'Overdue' : record.status}
                      </Badge>
                      {daysOverdue > 0 && !isPaid && (
                        <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400">
                          {daysOverdue} days overdue
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-main)] dark:border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[var(--text-muted)] dark:text-slate-400 block text-[11px]">
                        Due Balance:
                      </span>
                      <span
                        className={`font-mono font-bold text-sm ${
                          balance > 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatINR(balance)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[var(--text-muted)] dark:text-slate-400 block text-[11px]">
                        Due Date:
                      </span>
                      <span className="font-medium text-[var(--text-main)] dark:text-slate-200">
                        {formatDate(record.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Resident Information Card */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400">
                    Resident Information
                  </h4>
                  <div className="rounded-2xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-[var(--text-sub)] dark:text-slate-300">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[var(--text-main)] dark:text-white">
                            {record.tenant?.name || 'Resident'}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] dark:text-slate-400">
                            {record.room ? `Room ${record.room.roomNumber}` : 'Room —'}{' '}
                            {record.bed ? `• Bed ${record.bed.bedLabel}` : ''}
                          </p>
                        </div>
                      </div>

                      {record.tenant?.phone && (
                        <a
                          href={`tel:${record.tenant.phone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-main)] dark:border-slate-800 text-xs font-semibold text-[var(--text-main)] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5 text-emerald-500" />
                          <span>{formatPhone(record.tenant.phone)}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Charges Breakdown Card */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400">
                    Charges Breakdown
                  </h4>
                  <div className="rounded-2xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm text-xs space-y-2">
                    <div className="flex justify-between py-1">
                      <span className="text-[var(--text-sub)] dark:text-slate-300">
                        Base Monthly Rent
                      </span>
                      <span className="font-mono text-[var(--text-main)] dark:text-white">
                        {formatINR(record.rentAmount || amount)}
                      </span>
                    </div>

                    {Array.isArray(record.additionalCharges) &&
                      record.additionalCharges.map((charge, idx) =>
                        charge.amount > 0 ? (
                          <div key={idx} className="flex justify-between py-1">
                            <span className="text-[var(--text-sub)] dark:text-slate-300">
                              {charge.description || 'Additional Charge'}
                            </span>
                            <span className="font-mono text-[var(--text-main)] dark:text-white">
                              {formatINR(charge.amount)}
                            </span>
                          </div>
                        ) : null
                      )}

                    {record.lateFee > 0 && (
                      <div className="flex justify-between py-1 text-rose-500 dark:text-rose-400">
                        <span>Late Payment Fee</span>
                        <span className="font-mono font-semibold">
                          +{formatINR(record.lateFee)}
                        </span>
                      </div>
                    )}

                    {record.discount > 0 && (
                      <div className="flex justify-between py-1 text-emerald-600 dark:text-emerald-400">
                        <span>Discount / Concession</span>
                        <span className="font-mono font-semibold">
                          -{formatINR(record.discount)}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[var(--border-main)] dark:border-slate-800 flex justify-between font-bold text-sm">
                      <span className="text-[var(--text-main)] dark:text-white">Total Invoiced</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {formatINR(amount)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs py-1 text-emerald-600 dark:text-emerald-400">
                      <span>Paid Amount</span>
                      <span className="font-mono font-semibold">-{formatINR(paidAmount)}</span>
                    </div>

                    <div className="pt-1.5 border-t border-[var(--border-main)] dark:border-slate-800 flex justify-between font-black text-sm">
                      <span className="text-[var(--text-main)] dark:text-white">Due Balance</span>
                      <span className="font-mono text-rose-600 dark:text-rose-400">
                        {formatINR(balance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Payment Receipt Section (if paid or partial) */}
                {(isPaid || paidAmount > 0 || record.invoiceUrl) && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400">
                      Payment Receipt & Audit
                    </h4>
                    <div className="rounded-2xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm text-xs space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[var(--text-muted)] dark:text-slate-400 block text-[11px]">
                            Receipt Number:
                          </span>
                          <span className="font-mono font-semibold text-[var(--text-main)] dark:text-white">
                            {record.invoiceNumber || 'RCP-PENDING'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)] dark:text-slate-400 block text-[11px]">
                            Settlement Date:
                          </span>
                          <span className="font-medium text-[var(--text-main)] dark:text-white">
                            {formatDate(record.paidAt || record.updatedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-[var(--border-main)] dark:border-slate-800">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-xl text-xs h-9"
                          onClick={() => setReceiptOpen(true)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                          <span>View Receipt</span>
                        </Button>

                        <Button
                          size="sm"
                          className="flex-1 rounded-xl text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white"
                          onClick={handleDownload}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          <span>Download PDF</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Reminders Sent History */}
                {Array.isArray(record.remindersSent) && record.remindersSent.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400">
                      Reminders Sent History ({record.remindersSent.length})
                    </h4>
                    <div className="rounded-2xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm divide-y divide-[var(--border-main)] dark:divide-slate-800 text-xs">
                      {record.remindersSent.map((rem, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between first:pt-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <Bell className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                            <div>
                              <span className="font-semibold uppercase text-[11px] text-[var(--text-main)] dark:text-white">
                                {rem.channel}
                              </span>
                              <span className="text-[11px] text-[var(--text-muted)] dark:text-slate-400 block">
                                {formatDate(rem.sentAt || rem.createdAt)}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                            Sent
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          {record && (
            <DialogFooter className="p-4 border-t border-[var(--border-main)] dark:border-slate-800/80 bg-[var(--bg-card-subtle)] dark:bg-slate-950/40 shrink-0 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {!isPaid && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs h-9 border-[var(--border-main)] dark:border-slate-800"
                      onClick={() => verifyStatusMutation.mutate()}
                      disabled={verifyStatusMutation.isPending}
                    >
                      {verifyStatusMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-emerald-500" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                      )}
                      <span>Verify</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs h-9 border-[var(--border-main)] dark:border-slate-800"
                      onClick={() => setPaymentLinkOpen(true)}
                    >
                      <Link2 className="h-3.5 w-3.5 mr-1.5 text-sky-500" />
                      <span>Payment Link</span>
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isPaid && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs h-9 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                      onClick={handleWhatsAppReminder}
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                      <span>WhatsApp</span>
                    </Button>

                    <Button
                      size="sm"
                      className="rounded-xl text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                      onClick={() => setRecordPayOpen(true)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      <span>Record Payment</span>
                    </Button>
                  </>
                )}
                {isPaid && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs h-9"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                )}
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Sub-modals */}
      {record && (
        <>
          <ReceiptModal
            open={receiptOpen}
            onOpenChange={setReceiptOpen}
            record={record}
          />
          <RecordPaymentModal
            open={recordPayOpen}
            onOpenChange={setRecordPayOpen}
            record={record}
            propertyId={propertyId}
          />
          <PaymentLinkModal
            open={paymentLinkOpen}
            onOpenChange={setPaymentLinkOpen}
            record={record}
            propertyId={propertyId}
          />
        </>
      )}
    </>
  );
}
