'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  User,
  Phone,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  MessageCircle,
  Link2,
  RefreshCw,
  Loader2,
  Receipt,
  Bell,
  Building,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { rentApi } from '@/features/rent/api/rent.api';
import { formatINR, formatDate, formatPhone, formatMonthYear, getDaysOverdue } from '@/lib/utils';
import { buildWhatsAppMessage, openWhatsAppShare } from '@/features/rent/utils/whatsappHelper';
import { downloadReceipt } from '@/features/rent/utils/receiptHelper';
import { ReceiptModal } from '@/features/rent/components/ReceiptModal';
import { RecordPaymentModal } from '@/features/rent/components/RecordPaymentModal';
import { PaymentLinkModal } from '@/features/rent/components/PaymentLinkModal';
import { useToast } from '@/components/ui/toast';
import type { RentRecord } from '@/types/rent';

export default function SingleInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const propertyId = params.propertyId as string;
  const rentId = params.rentId as string;

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [recordPayOpen, setRecordPayOpen] = useState(false);
  const [paymentLinkOpen, setPaymentLinkOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: recordData, isLoading, error, refetch } = useQuery({
    queryKey: ['rent-record', rentId],
    queryFn: () => rentApi.getRentRecord(rentId),
    enabled: !!rentId,
  });

  const record: RentRecord | null = recordData?.data || null;

  // Live Gateway Verification
  const verifyStatusMutation = useMutation({
    mutationFn: () => rentApi.verifyPaymentStatus(rentId),
    onSuccess: (res) => {
      const data = res.data;
      if (data?.verified && data?.status === 'paid') {
        toast.success('Payment Verified! 🎉', 'Confirmed settled and marked as paid.');
        queryClient.invalidateQueries({ queryKey: ['pg-rents', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['pg-rent-summary', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['rent-record', rentId] });
        refetch();
      } else {
        toast.info('Verification Result', data?.message || `Current status: ${record?.status}`);
      }
    },
    onError: (err: Error) => {
      toast.error('Verification Error', err.message || 'Could not verify status with gateway.');
    },
  });

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
    <DashboardLayout propertyId={propertyId}>
      <PageHeader
        title={
          record
            ? `Invoice — ${formatMonthYear(record.billingMonth, record.billingYear)}`
            : 'Invoice Details'
        }
        description={
          record?.tenant?.name
            ? `Rent invoice details for resident ${record.tenant.name}`
            : 'Review breakdown, payment audit, and dispatch reminders'
        }
        breadcrumbs={[
          { label: 'Properties', href: '/dashboard' },
          { label: 'Overview', href: `/properties/${propertyId}` },
          { label: 'Rent Collection', href: `/properties/${propertyId}/rent` },
          { label: 'Invoice Details' },
        ]}
      >
        <Link href={`/properties/${propertyId}/rent`}>
          <Button variant="outline" size="sm" className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            <span>Back to Invoices</span>
          </Button>
        </Link>
      </PageHeader>

      {isLoading ? (
        <div className="mt-8 space-y-6 max-w-4xl mx-auto">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : error || !record ? (
        <div className="mt-8 max-w-md mx-auto rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center text-rose-300 space-y-4">
          <AlertTriangle className="h-10 w-10 mx-auto text-rose-400" />
          <p className="font-semibold">Invoice Not Found</p>
          <p className="text-xs text-rose-300/80">
            This invoice ID may be invalid or you do not have permissions to access it.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/properties/${propertyId}/rent`)}
            className="rounded-xl"
          >
            Return to Rent Collection
          </Button>
        </div>
      ) : (
        <div className="mt-8 max-w-4xl mx-auto space-y-6 pb-16">
          {/* Top Amount & Status Card */}
          <div className="rounded-2xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] dark:text-slate-400">
                  Billing Period: {formatMonthYear(record.billingMonth, record.billingYear)}
                </span>
                <div className="text-4xl font-black text-[var(--text-main)] dark:text-white font-mono mt-1">
                  {formatINR(amount)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    isPaid
                      ? 'default'
                      : isOverdue
                      ? 'destructive'
                      : 'warning'
                  }
                  dot
                  className="text-xs uppercase font-bold px-3 py-1"
                >
                  {isOverdue && !isPaid ? 'Overdue' : record.status}
                </Badge>
                {daysOverdue > 0 && !isPaid && (
                  <span className="text-xs font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-500/20">
                    {daysOverdue} days overdue
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--border-main)] dark:border-slate-800 text-xs">
              <div>
                <span className="text-[var(--text-muted)] dark:text-slate-400 block text-[11px]">
                  Total Paid:
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">
                  {formatINR(paidAmount)}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] dark:text-slate-400 block text-[11px]">
                  Remaining Balance:
                </span>
                <span
                  className={`font-mono font-bold text-base ${
                    balance > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {formatINR(balance)}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] dark:text-slate-400 block text-[11px]">
                  Due Date:
                </span>
                <span className="font-medium text-[var(--text-main)] dark:text-slate-200 text-sm">
                  {formatDate(record.dueDate)}
                </span>
              </div>
            </div>

            {/* Quick Action Ribbon */}
            <div className="pt-4 border-t border-[var(--border-main)] dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
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
                      <span>Verify Live Status</span>
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
                      <span>WhatsApp Reminder</span>
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
              </div>
            </div>
          </div>

          {/* Resident Details Card */}
          <div className="rounded-2xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400">
              Resident & Accommodation
            </h4>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-[var(--text-sub)] dark:text-slate-300">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-base text-[var(--text-main)] dark:text-white">
                    {record.tenant?.name || 'Resident'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] dark:text-slate-400 mt-0.5">
                    {record.room ? `Room ${record.room.roomNumber}` : 'Room —'}{' '}
                    {record.bed ? `• Bed ${record.bed.bedLabel}` : ''}{' '}
                    {record.pg?.name ? `• ${record.pg.name}` : ''}
                  </p>
                </div>
              </div>

              {record.tenant?.phone && (
                <a
                  href={`tel:${record.tenant.phone}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-main)] dark:border-slate-800 text-xs font-semibold text-[var(--text-main)] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-fit"
                >
                  <Phone className="h-4 w-4 text-emerald-500" />
                  <span>{formatPhone(record.tenant.phone)}</span>
                </a>
              )}
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="rounded-2xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400">
              Charges Breakdown
            </h4>
            <div className="divide-y divide-[var(--border-main)] dark:divide-slate-800/80 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-[var(--text-sub)] dark:text-slate-300 font-medium">
                  Base Monthly Rent
                </span>
                <span className="font-mono text-[var(--text-main)] dark:text-white font-semibold">
                  {formatINR(record.rentAmount || amount)}
                </span>
              </div>

              {Array.isArray(record.additionalCharges) &&
                record.additionalCharges.map((charge, idx) =>
                  charge.amount > 0 ? (
                    <div key={idx} className="flex justify-between py-2.5">
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
                <div className="flex justify-between py-2.5 text-rose-500 dark:text-rose-400">
                  <span>Late Payment Fee</span>
                  <span className="font-mono font-semibold">+{formatINR(record.lateFee)}</span>
                </div>
              )}

              {record.discount > 0 && (
                <div className="flex justify-between py-2.5 text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span className="font-mono font-semibold">-{formatINR(record.discount)}</span>
                </div>
              )}

              <div className="flex justify-between py-3 font-bold text-sm">
                <span className="text-[var(--text-main)] dark:text-white">Total Invoiced</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {formatINR(amount)}
                </span>
              </div>

              <div className="flex justify-between py-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                <span>Paid Amount</span>
                <span className="font-mono font-semibold">-{formatINR(paidAmount)}</span>
              </div>

              <div className="flex justify-between py-3 font-black text-base">
                <span className="text-[var(--text-main)] dark:text-white">Due Balance</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">
                  {formatINR(balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Receipt Card */}
          {(isPaid || paidAmount > 0 || record.invoiceUrl) && (
            <div className="rounded-2xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400">
                Payment Receipt & Audit History
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[var(--text-muted)] dark:text-slate-400 block text-[11px]">
                    Receipt Number
                  </span>
                  <span className="font-mono font-bold text-[var(--text-main)] dark:text-white text-sm">
                    {record.invoiceNumber || 'RCP-PENDING'}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] dark:text-slate-400 block text-[11px]">
                    Payment Date
                  </span>
                  <span className="font-medium text-[var(--text-main)] dark:text-slate-200">
                    {formatDate(record.paidAt || record.updatedAt)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] dark:text-slate-400 block text-[11px]">
                    Payment Method
                  </span>
                  <span className="font-semibold uppercase text-[var(--text-main)] dark:text-white">
                    {String(record.paymentMethod || 'Online')}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-[var(--border-main)] dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs h-9"
                  onClick={() => setReceiptOpen(true)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                  <span>View Receipt</span>
                </Button>

                <Button
                  size="sm"
                  className="rounded-xl text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  <span>Download PDF Receipt</span>
                </Button>
              </div>
            </div>
          )}

          {/* Reminder History Log */}
          {Array.isArray(record.remindersSent) && record.remindersSent.length > 0 && (
            <div className="rounded-2xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400">
                Reminders Sent History ({record.remindersSent.length})
              </h4>
              <div className="divide-y divide-[var(--border-main)] dark:divide-slate-800 text-xs">
                {record.remindersSent.map((rem, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <Bell className="h-4 w-4 text-sky-500 shrink-0" />
                      <div>
                        <span className="font-semibold uppercase text-xs text-[var(--text-main)] dark:text-white">
                          {rem.channel}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] dark:text-slate-400 block">
                          Dispatched on {formatDate(rem.sentAt || rem.createdAt, 'dd MMM yyyy, hh:mm a')}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                      Delivered
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
    </DashboardLayout>
  );
}
