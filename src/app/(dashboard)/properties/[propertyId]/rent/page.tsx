'use client';

import React, { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { rentApi } from '@/features/rent/api/rent.api';
import { formatINR, formatDate, formatPhone } from '@/lib/utils';
import type { RentRecord, PaymentMethod, MarkRentPaidRequest } from '@/types/rent';

export default function RentManagementPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const propertyId = params.propertyId as string;
  const queryClient = useQueryClient();

  const initialStatus = searchParams.get('status') || 'all';

  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [dueDayOfMonth, setDueDayOfMonth] = useState('5');
  const [paymentRecord, setPaymentRecord] = useState<RentRecord | null>(null);

  // Record Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('upi');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Fetch Rent Records
  const { data: rentData, isLoading } = useQuery({
    queryKey: ['pg-rents', propertyId, currentMonth, currentYear, statusFilter],
    queryFn: () =>
      rentApi.getRentRecords(propertyId, {
        month: currentMonth,
        year: currentYear,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
    enabled: !!propertyId,
  });

  // Fetch Rent Summary
  const { data: summaryData } = useQuery({
    queryKey: ['pg-rent-summary', propertyId, currentMonth, currentYear],
    queryFn: () =>
      rentApi.getRentSummary(propertyId, {
        month: currentMonth,
        year: currentYear,
      }),
    enabled: !!propertyId,
  });

  const records: RentRecord[] = rentData?.data || [];
  const summary = summaryData?.data;

  // Generate Rent Mutation
  const generateRentMutation = useMutation({
    mutationFn: () =>
      rentApi.generateRent(propertyId, {
        month: currentMonth,
        year: currentYear,
        dueDayOfMonth: parseInt(dueDayOfMonth, 10) || 5,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['pg-rents', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pg-rent-summary', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
      setIsGenerateOpen(false);
      alert(`Success: ${res.data?.created || 0} rent records generated!`);
    },
  });

  // Mark Rent Paid Mutation
  const markPaidMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MarkRentPaidRequest }) =>
      rentApi.markRentPaid(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pg-rents', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pg-rent-summary', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
      setPaymentRecord(null);
      setPayAmount('');
      setPayReference('');
      setPayNotes('');
    },
  });

  // Send Reminder Mutation
  const sendReminderMutation = useMutation({
    mutationFn: (id: string) =>
      rentApi.sendReminder(id, { channel: 'whatsapp', type: 'overdue' }),
    onSuccess: () => {
      alert('WhatsApp reminder sent to resident!');
      queryClient.invalidateQueries({ queryKey: ['pg-rents', propertyId] });
    },
  });

  // Send Bulk Reminders Mutation
  const sendBulkRemindersMutation = useMutation({
    mutationFn: (targetIds: string[]) =>
      rentApi.sendBulkReminders(targetIds, 'whatsapp', 'due_reminder'),
    onSuccess: (res) => {
      const sentCount = res.data?.successful ?? 0;
      alert(`Bulk WhatsApp reminders processed: ${sentCount} dispatched successfully!`);
      queryClient.invalidateQueries({ queryKey: ['pg-rents', propertyId] });
    },
    onError: (err: Error) => {
      alert(err.message || 'Failed to dispatch reminders.');
    },
  });

  const handleMarkPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRecord || !payAmount) return;

    markPaidMutation.mutate({
      id: paymentRecord._id,
      payload: {
        amount: parseFloat(payAmount),
        method: payMethod,
        reference: payReference || undefined,
        notes: payNotes || undefined,
      },
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <DashboardLayout propertyId={propertyId}>
      <PageHeader
        title="Rent & Collections"
        description="Monitor billings, generate monthly invoices, trigger WhatsApp reminders, and record collections."
        breadcrumbs={[
          { label: 'Properties', href: '/dashboard' },
          { label: 'Overview', href: `/properties/${propertyId}` },
          { label: 'Rent Collection' },
        ]}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const pendingIds = records
              .filter((r) => ['pending', 'overdue', 'partial'].includes(r.status))
              .map((r) => r._id);

            if (pendingIds.length === 0) {
              alert('All tenants in this list are paid up! No pending or overdue invoices found.');
              return;
            }

            sendBulkRemindersMutation.mutate(pendingIds);
          }}
          isLoading={sendBulkRemindersMutation.isPending}
        >
          <MessageSquare className="h-4 w-4 mr-1.5 text-emerald-400" />
          <span>Remind All Pending</span>
        </Button>

        <Button size="sm" onClick={() => setIsGenerateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          <span>Generate Invoices</span>
        </Button>
      </PageHeader>

      {/* Period & Summary Strip */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
            className="h-10 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {monthNames.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
            className="h-10 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
          >
            {[2024, 2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
          {['all', 'overdue', 'pending', 'partial', 'paid'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                statusFilter === st
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Expected"
          value={formatINR(summary?.totalExpected || 0)}
          subtitle={`${records.length} active invoices generated`}
          icon={<Receipt className="h-5 w-5" />}
          accentColor="sky"
        />
        <StatCard
          title="Total Collected"
          value={formatINR(summary?.totalCollected || 0)}
          subtitle={`${summary?.paidCount || 0} residents fully cleared`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Total Pending"
          value={formatINR(summary?.totalPending || 0)}
          subtitle={`${summary?.pendingCount || 0} invoices awaiting payment`}
          icon={<Clock className="h-5 w-5" />}
          accentColor="amber"
        />
        <StatCard
          title="Overdue Balance"
          value={formatINR(summary?.totalOverdue || 0)}
          subtitle={`${summary?.overdueCount || 0} critical overdue alerts`}
          icon={<AlertTriangle className="h-5 w-5" />}
          accentColor="rose"
        />
      </div>

      {/* Invoices Table */}
      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Receipt className="h-8 w-8 text-emerald-400" />}
            title="No rent invoices generated for this period"
            description="Generate rent invoices for all active residents with one click."
            actionLabel="Generate Invoices Now"
            onAction={() => setIsGenerateOpen(true)}
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Resident</th>
                  <th className="px-6 py-4">Room & Bed</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Invoice Total</th>
                  <th className="px-6 py-4">Paid</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {records.map((record) => {
                  const balance = Math.max(0, record.totalAmount - record.paidAmount);
                  const isPaid = record.status === 'paid';

                  return (
                    <tr
                      key={record._id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-white">
                            {record.tenant?.name || 'Resident'}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {formatPhone(record.tenant?.phone)}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {record.room ? `Room ${record.room.roomNumber}` : '—'}{' '}
                        {record.bed ? `(${record.bed.bedLabel})` : ''}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400">
                        {formatDate(record.dueDate)}
                      </td>

                      <td className="px-6 py-4 font-mono font-medium text-white">
                        {formatINR(record.totalAmount)}
                      </td>

                      <td className="px-6 py-4 font-mono text-emerald-400">
                        {formatINR(record.paidAmount)}
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-rose-400">
                        {formatINR(balance)}
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            record.status === 'paid'
                              ? 'default'
                              : record.status === 'overdue'
                              ? 'destructive'
                              : 'warning'
                          }
                          dot
                        >
                          {record.status}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid && (
                            <>
                              <Button
                                variant="subtle"
                                size="sm"
                                onClick={() => {
                                  setPaymentRecord(record);
                                  setPayAmount(String(balance));
                                }}
                              >
                                Record Pay
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                onClick={() => sendReminderMutation.mutate(record._id)}
                                title="Send WhatsApp Reminder"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {isPaid && (
                            <span className="text-xs font-semibold text-emerald-400 inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Settled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Rent Modal */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Monthly Invoices</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-slate-400 leading-relaxed">
              This will calculate rent and generate invoices for all active residents for{' '}
              <span className="font-semibold text-white">
                {monthNames[currentMonth - 1]} {currentYear}
              </span>
              . Residents with existing records will be safely skipped.
            </p>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-300">
                Due Day of Month
              </label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dueDayOfMonth}
                onChange={(e) => setDueDayOfMonth(e.target.value)}
                className="mt-1 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                E.g. Invoices will be due on the 5th of the month.
              </p>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGenerateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => generateRentMutation.mutate()}
                isLoading={generateRentMutation.isPending}
              >
                Generate Invoices
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={!!paymentRecord} onOpenChange={(open) => !open && setPaymentRecord(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Rent Payment</DialogTitle>
          </DialogHeader>
          {paymentRecord && (
            <form onSubmit={handleMarkPaymentSubmit} className="space-y-4 mt-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Resident:</span>
                  <span className="font-semibold text-white">
                    {paymentRecord.tenant?.name}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Outstanding Balance:</span>
                  <span className="font-bold text-rose-400 font-mono">
                    {formatINR(paymentRecord.totalAmount - paymentRecord.paidAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Amount Received (₹) *
                </label>
                <Input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  className="mt-1 font-mono text-base"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="cash">Cash in Hand</option>
                  <option value="bank_transfer">Direct Bank Transfer / NEFT / IMPS</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online Gateway</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Transaction / UPI Reference ID
                </label>
                <Input
                  placeholder="e.g. 329847298347"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Notes
                </label>
                <Input
                  placeholder="Optional payment notes"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="mt-1"
                />
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentRecord(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={markPaidMutation.isPending}>
                  Record & Update
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
