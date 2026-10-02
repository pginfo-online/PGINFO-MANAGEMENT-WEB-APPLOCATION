'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Search,
  Settings,
  Link2,
  Download,
  Eye,
  RefreshCw,
  MoreVertical,
  CheckSquare,
  Square,
  Send,
  Phone,
  User,
  Filter,
  ArrowUpDown,
  Loader2,
  Calendar,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { rentApi } from '@/features/rent/api/rent.api';
import { formatINR, formatDate, formatPhone, formatMonthYear, getDaysOverdue } from '@/lib/utils';
import { RentSummaryCards } from '@/features/rent/components/RentSummaryCards';
import { InvoiceDetailsModal } from '@/features/rent/components/InvoiceDetailsModal';
import { RecordPaymentModal } from '@/features/rent/components/RecordPaymentModal';
import { PaymentLinkModal } from '@/features/rent/components/PaymentLinkModal';
import { ReceiptModal } from '@/features/rent/components/ReceiptModal';
import { RentSettingsModal } from '@/features/rent/components/RentSettingsModal';
import { BulkReminderDialog } from '@/features/rent/components/BulkReminderDialog';
import { buildWhatsAppMessage, openWhatsAppShare } from '@/features/rent/utils/whatsappHelper';
import { downloadReceipt } from '@/features/rent/utils/receiptHelper';
import { useToast } from '@/components/ui/toast';
import type { RentRecord, PaymentMethod } from '@/types/rent';

export default function RentManagementPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const propertyId = params.propertyId as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const initialStatus = searchParams.get('status') || 'all';

  // Filters state
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or '1'..'12'
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());

  // Active Modals state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [dueDayOfMonth, setDueDayOfMonth] = useState('5');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bulkReminderOpen, setBulkReminderOpen] = useState(false);
  const [bulkTargetRecords, setBulkTargetRecords] = useState<RentRecord[]>([]);

  // Individual action modals
  const [activeDetailRentId, setActiveDetailRentId] = useState<string | null>(null);
  const [activePaymentRecord, setActivePaymentRecord] = useState<RentRecord | null>(null);
  const [activeLinkRecord, setActiveLinkRecord] = useState<RentRecord | null>(null);
  const [activeReceiptRecord, setActiveReceiptRecord] = useState<RentRecord | null>(null);

  // Month param for API: undefined if 'all'
  const apiMonth = selectedMonth !== 'all' ? parseInt(selectedMonth, 10) : undefined;
  const apiYear = selectedMonth !== 'all' ? currentYear : undefined;

  // 1. Fetch Rent Records
  const {
    data: rentData,
    isLoading: isLoadingRecords,
    isError: isRecordsError,
    refetch: refetchRecords,
  } = useQuery({
    queryKey: ['pg-rents', propertyId, apiMonth, apiYear, statusFilter],
    queryFn: () =>
      rentApi.getRentRecords(propertyId, {
        month: apiMonth,
        year: apiYear,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 100,
      }),
    enabled: !!propertyId,
  });

  // 2. Fetch Rent Summary
  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['pg-rent-summary', propertyId, apiMonth, apiYear],
    queryFn: () =>
      rentApi.getRentSummary(propertyId, {
        month: apiMonth,
        year: apiYear,
      }),
    enabled: !!propertyId,
  });

  const rawRecords: RentRecord[] = rentData?.data || [];
  const summary = summaryData?.data;

  // Client-side text search (name, room, phone)
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return rawRecords;
    const q = searchQuery.toLowerCase().trim();
    return rawRecords.filter((r) => {
      const name = r.tenant?.name?.toLowerCase() || '';
      const phone = r.tenant?.phone?.toLowerCase() || '';
      const room = r.room?.roomNumber?.toLowerCase() || '';
      return name.includes(q) || phone.includes(q) || room.includes(q);
    });
  }, [rawRecords, searchQuery]);

  // Generate Invoices Mutation
  const generateRentMutation = useMutation({
    mutationFn: () => {
      const targetMonth = selectedMonth !== 'all' ? parseInt(selectedMonth, 10) : new Date().getMonth() + 1;
      return rentApi.generateRent(propertyId, {
        month: targetMonth,
        year: currentYear,
        dueDayOfMonth: parseInt(dueDayOfMonth, 10) || 5,
      });
    },
    onSuccess: (res) => {
      const created = res.data?.created || 0;
      const skipped = res.data?.skipped || 0;
      toast.success(
        'Invoices Generated Successfully! 🎉',
        `${created} new rent invoices generated, ${skipped} existing records preserved.`
      );
      queryClient.invalidateQueries({ queryKey: ['pg-rents', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pg-rent-summary', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
      setIsGenerateOpen(false);
    },
    onError: (err: Error) => {
      toast.error('Invoice Generation Failed', err.message || 'Could not generate monthly invoices.');
    },
  });

  // Single WhatsApp Reminder dispatch
  const handleSingleWhatsApp = useCallback((record: RentRecord) => {
    const balance = Math.max(0, record.totalAmount - record.paidAmount);
    const daysOverdue = getDaysOverdue(record.dueDate);
    const isOverdue = record.status === 'overdue' || daysOverdue > 0;
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
    // Audit reminder sent on backend
    rentApi.sendReminder(record._id, { channel: 'whatsapp', type: isOverdue ? 'overdue' : 'due_reminder' }).catch(() => {});
    toast.success('WhatsApp Opened', 'Payment reminder prepared for resident.');
  }, [toast]);

  // Single Receipt Download
  const handleDownloadReceipt = useCallback(async (record: RentRecord) => {
    if (!record.invoiceUrl) {
      toast.error('Download Unavailable', 'Receipt has not been generated for this invoice yet.');
      return;
    }
    try {
      const ok = await downloadReceipt(record.invoiceUrl, record.invoiceNumber || 'RCP');
      if (ok) toast.success('Receipt Downloaded');
      else toast.error('Download Failed');
    } catch {
      toast.error('Download Failed', 'Could not complete receipt download.');
    }
  }, [toast]);

  // Verify Single Payment Status
  const handleVerifyStatus = useCallback(async (record: RentRecord) => {
    try {
      const res = await rentApi.verifyPaymentStatus(record._id);
      const data = res.data;
      if (data?.verified && data?.status === 'paid') {
        toast.success('Payment Verified! 🎉', 'Confirmed settled and marked as paid.');
        queryClient.invalidateQueries({ queryKey: ['pg-rents', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['pg-rent-summary', propertyId] });
      } else {
        toast.info('Verification Result', data?.message || `Current status: ${record.status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gateway verification error';
      toast.error('Verification Error', msg);
    }
  }, [propertyId, queryClient, toast]);

  // Multi-Selection Checkbox Toggles
  const handleToggleSelectAll = () => {
    const pendingRecords = filteredRecords.filter((r) => ['pending', 'overdue', 'partial'].includes(r.status));
    if (selectedRecordIds.size === pendingRecords.length) {
      setSelectedRecordIds(new Set());
    } else {
      setSelectedRecordIds(new Set(pendingRecords.map((r) => r._id)));
    }
  };

  const handleToggleRecord = (id: string) => {
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Trigger Bulk Reminders for All Pending or Selected
  const handleTriggerBulkReminders = (recordsToRemind?: RentRecord[]) => {
    const list =
      recordsToRemind ||
      (selectedRecordIds.size > 0
        ? filteredRecords.filter((r) => selectedRecordIds.has(r._id))
        : filteredRecords.filter((r) => ['pending', 'overdue', 'partial'].includes(r.status)));

    if (list.length === 0) {
      toast.info('No Unpaid Invoices', 'All residents in this selection are already paid in full.');
      return;
    }

    setBulkTargetRecords(list);
    setBulkReminderOpen(true);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <DashboardLayout propertyId={propertyId}>
      {/* Header */}
      <PageHeader
        title="Rent & Collections"
        description="Monitor billings, generate monthly invoices, trigger WhatsApp reminders, and record payments."
        breadcrumbs={[
          { label: 'Properties', href: '/dashboard' },
          { label: 'Overview', href: `/properties/${propertyId}` },
          { label: 'Rent Collection' },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="rounded-xl border-[var(--border-main)] dark:border-slate-800 text-[var(--text-sub)] dark:text-slate-300"
          >
            <Settings className="h-4 w-4 mr-1.5" />
            <span>Settings</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTriggerBulkReminders()}
            className="rounded-xl border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
          >
            <MessageSquare className="h-4 w-4 mr-1.5 text-emerald-500" />
            <span>Remind All Pending</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsGenerateOpen(true)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Generate Invoices</span>
          </Button>
        </div>
      </PageHeader>

      {/* KPI Cards Strip with defensive fallbacks */}
      <div className="mt-6">
        <RentSummaryCards
          summary={summary}
          records={rawRecords}
          isLoading={isLoadingSummary && isLoadingRecords}
          onFilterOverdue={() => setStatusFilter('overdue')}
        />
      </div>

      {/* Filter & Period Controls Bar */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[var(--border-main)] dark:border-slate-800 pb-6">
        {/* Month, Year, and Search Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-10 rounded-xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-900/90 px-3.5 text-xs font-semibold text-[var(--text-main)] dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
          >
            <option value="all">All Months (Overall)</option>
            {monthNames.map((name, idx) => (
              <option key={name} value={String(idx + 1)}>
                {name}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
            className="h-10 rounded-xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-900/90 px-3.5 text-xs font-semibold text-[var(--text-main)] dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono shadow-sm"
          >
            {[2024, 2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resident, room..."
              className="h-10 pl-9 text-xs rounded-xl border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-900/90"
            />
          </div>
        </div>

        {/* Status Tabs & Selection Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--border-main)] dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 p-1">
            {['all', 'overdue', 'pending', 'partial', 'paid'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  statusFilter === st
                    ? 'bg-white dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-xs'
                    : 'text-[var(--text-muted)] dark:text-slate-400 hover:text-[var(--text-main)] dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Multi-Select Mode Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedRecordIds(new Set());
            }}
            className={`rounded-xl text-xs h-9 ${
              isSelectionMode
                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                : 'border-[var(--border-main)] dark:border-slate-800'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
            <span>{isSelectionMode ? 'Cancel Select' : 'Select'}</span>
          </Button>
        </div>
      </div>

      {/* Floating Bulk Action Bar when items selected */}
      {isSelectionMode && selectedRecordIds.size > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/40 p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-800 dark:text-emerald-300">
              {selectedRecordIds.size} {selectedRecordIds.size === 1 ? 'invoice' : 'invoices'} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 rounded-lg"
              onClick={() => handleTriggerBulkReminders()}
            >
              <Send className="h-3 w-3 mr-1.5" />
              <span>Remind Selected ({selectedRecordIds.size})</span>
            </Button>
          </div>
        </div>
      )}

      {/* Invoices Table / States */}
      {isLoadingRecords ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 rounded-2xl border border-[var(--border-main)] dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-4 flex items-center justify-between"
            >
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          ))}
        </div>
      ) : isRecordsError ? (
        <div className="mt-8 rounded-2xl border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/20 p-8 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
          <p className="font-semibold text-rose-800 dark:text-rose-200 text-sm">
            Failed to Load Rent Invoices
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-400">
            Please check your network connection and retry.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetchRecords()}
            className="rounded-xl border-rose-300 dark:border-rose-500/40"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            <span>Retry</span>
          </Button>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Receipt className="h-8 w-8 text-emerald-500" />}
            title={
              searchQuery
                ? 'No matching rent invoices found'
                : 'No rent invoices generated for this selection'
            }
            description={
              searchQuery
                ? `No records found matching "${searchQuery}". Try clearing search.`
                : 'Generate monthly invoices for all active residents with one click.'
            }
            actionLabel={searchQuery ? 'Clear Search' : 'Generate Invoices Now'}
            onAction={() => (searchQuery ? setSearchQuery('') : setIsGenerateOpen(true))}
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border-main)] dark:border-slate-800/90 bg-white dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--text-sub)] dark:text-slate-300">
              <thead className="border-b border-[var(--border-main)] dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] dark:text-slate-400">
                <tr>
                  {isSelectionMode && (
                    <th className="px-4 py-3.5 w-10">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-slate-400 hover:text-[var(--text-main)] dark:hover:text-white"
                        title="Select All Pending"
                      >
                        {selectedRecordIds.size > 0 &&
                        selectedRecordIds.size ===
                          filteredRecords.filter((r) => ['pending', 'overdue', 'partial'].includes(r.status)).length ? (
                          <CheckSquare className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="px-6 py-4">Resident</th>
                  <th className="px-6 py-4">Room & Bed</th>
                  <th className="px-6 py-4">Billing Period</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Total Due</th>
                  <th className="px-6 py-4">Paid</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)] dark:divide-slate-800/60 text-xs">
                {filteredRecords.map((record) => {
                  const balance = Math.max(0, record.totalAmount - record.paidAmount);
                  const isPaid = record.status === 'paid' || balance === 0;
                  const daysOverdue = getDaysOverdue(record.dueDate);
                  const isOverdue = record.status === 'overdue' || (!isPaid && daysOverdue > 0);
                  const isSelected = selectedRecordIds.has(record._id);

                  return (
                    <tr
                      key={record._id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      {isSelectionMode && (
                        <td className="px-4 py-4">
                          {!isPaid ? (
                            <button
                              type="button"
                              onClick={() => handleToggleRecord(record._id)}
                              className="text-slate-400 hover:text-emerald-500"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <div
                          className="cursor-pointer group"
                          onClick={() => setActiveDetailRentId(record._id)}
                        >
                          <p className="font-bold text-[var(--text-main)] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {record.tenant?.name || 'Resident'}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] dark:text-slate-400 font-mono mt-0.5">
                            {formatPhone(record.tenant?.phone)}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-medium text-[var(--text-sub)] dark:text-slate-300">
                        {record.room ? `Room ${record.room.roomNumber}` : '—'}{' '}
                        {record.bed ? (
                          <span className="text-[var(--text-muted)] dark:text-slate-400 text-[11px]">
                            ({record.bed.bedLabel})
                          </span>
                        ) : (
                          ''
                        )}
                      </td>

                      <td className="px-6 py-4 font-medium text-[var(--text-main)] dark:text-slate-200">
                        {formatMonthYear(record.billingMonth, record.billingYear)}
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-[var(--text-sub)] dark:text-slate-300 block">
                          {formatDate(record.dueDate)}
                        </span>
                        {isOverdue && !isPaid && daysOverdue > 0 && (
                          <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 block mt-0.5">
                            {daysOverdue}d overdue
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-mono font-medium text-[var(--text-main)] dark:text-white">
                        {formatINR(record.totalAmount)}
                      </td>

                      <td className="px-6 py-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatINR(record.paidAmount)}
                      </td>

                      <td className="px-6 py-4 font-mono font-bold">
                        <span
                          className={
                            balance > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {formatINR(balance)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            isPaid
                              ? 'default'
                              : isOverdue
                              ? 'destructive'
                              : 'warning'
                          }
                          dot
                          className="capitalize text-[11px] font-semibold"
                        >
                          {isOverdue && !isPaid ? 'Overdue' : record.status}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Details Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => setActiveDetailRentId(record._id)}
                            title="View Full Details"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            <span>Details</span>
                          </Button>

                          {!isPaid ? (
                            <>
                              <Button
                                size="sm"
                                className="h-8 px-2.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                                onClick={() => setActivePaymentRecord(record)}
                              >
                                Record Pay
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/15"
                                onClick={() => handleSingleWhatsApp(record)}
                                title="Send WhatsApp Reminder"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>

                              {/* More actions dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-[var(--text-main)]"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 text-xs">
                                  <DropdownMenuItem
                                    onClick={() => setActiveLinkRecord(record)}
                                    className="gap-2 cursor-pointer"
                                  >
                                    <Link2 className="h-3.5 w-3.5 text-sky-500" />
                                    <span>Payment Link</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => handleVerifyStatus(record)}
                                    className="gap-2 cursor-pointer"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>Verify Gateway</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                onClick={() => setActiveReceiptRecord(record)}
                              >
                                <Receipt className="h-3.5 w-3.5 mr-1" />
                                <span>Receipt</span>
                              </Button>

                              {record.invoiceUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-emerald-500"
                                  onClick={() => handleDownloadReceipt(record)}
                                  title="Download PDF Receipt"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
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
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-[var(--border-main)] dark:border-slate-800 text-[var(--text-main)] dark:text-white p-0 overflow-hidden rounded-2xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-[var(--border-main)] dark:border-slate-800/80 bg-[var(--bg-card-subtle)] dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[var(--text-main)] dark:text-white">
                  Generate Monthly Invoices
                </DialogTitle>
                <p className="text-xs text-[var(--text-muted)] dark:text-slate-400 mt-0.5">
                  Calculate rent charges for active residents
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <p className="text-xs text-[var(--text-sub)] dark:text-slate-300 leading-relaxed">
              This will automatically compute room rents and generate invoice records for all active residents.
              Residents with existing invoices for this month will be safely skipped.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1 block">
                  Billing Month
                </label>
                <select
                  value={selectedMonth !== 'all' ? selectedMonth : String(new Date().getMonth() + 1)}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 text-xs text-[var(--text-main)] dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {monthNames.map((name, idx) => (
                    <option key={name} value={String(idx + 1)}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1 block">
                  Billing Year
                </label>
                <Input
                  type="number"
                  value={currentYear}
                  onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                  className="font-mono text-xs bg-white dark:bg-slate-950/80 border-[var(--border-main)] dark:border-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1 block">
                Due Day of Month
              </label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dueDayOfMonth}
                onChange={(e) => setDueDayOfMonth(e.target.value)}
                className="font-mono text-xs bg-white dark:bg-slate-950/80 border-[var(--border-main)] dark:border-slate-800"
              />
              <p className="text-[11px] text-[var(--text-muted)] dark:text-slate-500 mt-1">
                Invoices will be marked due on the {dueDayOfMonth}th of the month.
              </p>
            </div>

            <DialogFooter className="pt-4 border-t border-[var(--border-main)] dark:border-slate-800/80 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGenerateOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={() => generateRentMutation.mutate()}
                disabled={generateRentMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
              >
                {generateRentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                <span>Generate Now</span>
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Interactive Modals */}
      <InvoiceDetailsModal
        open={!!activeDetailRentId}
        onOpenChange={(open) => !open && setActiveDetailRentId(null)}
        rentId={activeDetailRentId}
        propertyId={propertyId}
      />

      <RecordPaymentModal
        open={!!activePaymentRecord}
        onOpenChange={(open) => !open && setActivePaymentRecord(null)}
        record={activePaymentRecord}
        propertyId={propertyId}
      />

      <PaymentLinkModal
        open={!!activeLinkRecord}
        onOpenChange={(open) => !open && setActiveLinkRecord(null)}
        record={activeLinkRecord}
        propertyId={propertyId}
      />

      <ReceiptModal
        open={!!activeReceiptRecord}
        onOpenChange={(open) => !open && setActiveReceiptRecord(null)}
        record={activeReceiptRecord}
      />

      <RentSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        propertyId={propertyId}
      />

      <BulkReminderDialog
        open={bulkReminderOpen}
        onOpenChange={setBulkReminderOpen}
        targetRecords={bulkTargetRecords}
        propertyId={propertyId}
        onSuccess={() => {
          setSelectedRecordIds(new Set());
          setIsSelectionMode(false);
        }}
      />
    </DashboardLayout>
  );
}
