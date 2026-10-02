'use client';

import React, { useState } from 'react';
import {
  Receipt,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  FileText,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReceiptModal } from '@/features/rent/components/ReceiptModal';
import { formatINR, formatDate } from '@/lib/utils';
import type { RentRecord } from '@/types/rent';

interface TenantRentHistoryProps {
  records: RentRecord[];
  tenantName: string;
  tenantPhone?: string;
  isLoading?: boolean;
}

export function TenantRentHistory({
  records,
  tenantName,
  tenantPhone,
  isLoading = false,
}: TenantRentHistoryProps) {
  const [selectedRecord, setSelectedRecord] = useState<RentRecord | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          label: 'Paid',
          cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-500',
        };
      case 'partial':
        return {
          label: 'Partial',
          cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          dot: 'bg-amber-500',
        };
      case 'overdue':
        return {
          label: 'Overdue',
          cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          dot: 'bg-rose-500',
        };
      case 'pending':
      default:
        return {
          label: 'Pending',
          cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          dot: 'bg-blue-500',
        };
    }
  };

  const handleOpenReceipt = (rec: RentRecord) => {
    setSelectedRecord(rec);
    setReceiptOpen(true);
  };

  const handleSendReminderWhatsApp = (rec: RentRecord) => {
    if (!tenantPhone) return;
    const cleanPhone = tenantPhone.replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const amountDue = (rec.totalAmount || 0) - (rec.paidAmount || 0);
    const month = rec.billingMonth
      ? new Date(2000, rec.billingMonth - 1).toLocaleString('default', { month: 'long' })
      : '';
    const text = `Hi ${tenantName}, this is a gentle reminder regarding your rent of ${formatINR(
      amountDue
    )} for ${month} ${rec.billingYear || ''}. Please clear the due at your earliest convenience. Thank you!`;

    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl border border-[var(--line)] bg-[var(--card)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--card)] p-8 text-center">
        <Receipt className="h-8 w-8 text-[var(--muted)] mx-auto mb-2 opacity-50" />
        <h4 className="text-sm font-bold text-[var(--ink)]">No Rent Invoices Found</h4>
        <p className="text-xs text-[var(--muted)] mt-1 max-w-sm mx-auto">
          Rent invoices and payment receipts will appear here once generated in the Rent module.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((rec) => {
        const statusCfg = getStatusBadge(rec.status || 'pending');
        const monthName = rec.billingMonth
          ? new Date(2000, rec.billingMonth - 1).toLocaleString('default', { month: 'short' })
          : '';
        const isPaid = rec.status === 'paid' || (rec.paidAmount && rec.paidAmount > 0);
        const amountDue = (rec.totalAmount || 0) - (rec.paidAmount || 0);

        return (
          <div
            key={rec._id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[var(--line)] bg-[var(--card)] hover:border-emerald-500/30 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--ink)]">
                    {monthName} {rec.billingYear || ''} Rent
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${statusCfg.cls}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--muted)] mt-1">
                  <span className="font-mono text-[var(--muted)]">
                    Inv: {rec.invoiceNumber || rec._id.slice(-6).toUpperCase()}
                  </span>
                  {rec.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due {formatDate(rec.dueDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--line)]">
              <div className="text-left sm:text-right">
                <p className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  {formatINR(rec.paidAmount || rec.totalAmount || 0)}
                </p>
                {amountDue > 0 && rec.status !== 'paid' && (
                  <p className="text-[11px] font-mono text-rose-500 font-semibold">
                    Due: {formatINR(amountDue)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {isPaid && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenReceipt(rec)}
                    className="h-8 text-xs font-semibold gap-1"
                  >
                    <FileText className="h-3.5 w-3.5 text-emerald-500" />
                    Receipt
                  </Button>
                )}

                {!isPaid && tenantPhone && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendReminderWhatsApp(rec)}
                    className="h-8 text-xs font-semibold gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Remind
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Reusable Receipt Modal */}
      <ReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        record={selectedRecord}
      />
    </div>
  );
}
