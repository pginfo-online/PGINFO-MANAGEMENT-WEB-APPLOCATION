'use client';

import React, { useState } from 'react';
import {
  Receipt,
  Download,
  ExternalLink,
  X,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatINR, formatDate } from '@/lib/utils';
import { getReceiptPreviewUrl, downloadReceipt } from '../utils/receiptHelper';
import { useToast } from '@/components/ui/toast';
import type { RentRecord } from '@/types/rent';

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: RentRecord | null;
  receiptUrl?: string | null;
  invoiceNumber?: string | null;
}

export function ReceiptModal({
  open,
  onOpenChange,
  record,
  receiptUrl: directReceiptUrl,
  invoiceNumber: directInvoiceNumber,
}: ReceiptModalProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const rawUrl = directReceiptUrl || record?.invoiceUrl;
  const receiptNo = directInvoiceNumber || record?.invoiceNumber || 'RCP-RENT';
  const previewUrl = getReceiptPreviewUrl(rawUrl);

  const amount = record?.paidAmount || record?.totalAmount || 0;
  const tenantName = record?.tenant?.name || 'Resident';
  const tenantPhone = record?.tenant?.phone || '';
  const roomInfo = record?.room ? `Room ${record.room.roomNumber}` : '';
  const paymentDate = record?.paidAt || record?.updatedAt || record?.createdAt || new Date();
  const paymentMethod = record?.paymentMethod || (record?.paymentHistory?.[0]?.method) || 'Online';

  const handleDownload = async () => {
    if (!rawUrl) {
      toast.error('Download Failed', 'Receipt URL is not available for this record.');
      return;
    }
    setIsDownloading(true);
    try {
      const ok = await downloadReceipt(rawUrl, receiptNo);
      if (ok) {
        toast.success('Receipt Downloaded', `Receipt ${receiptNo} has been saved.`);
      } else {
        toast.error('Download Failed', 'Could not initiate file download.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      toast.error('Download Failed', msg);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenExternal = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border border-[var(--border-main)] dark:border-slate-800 text-[var(--text-main)] dark:text-white p-0 overflow-hidden rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-main)] dark:border-slate-800/80 p-5 bg-[var(--bg-card-subtle)] dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[var(--text-main)] dark:text-white">
                Payment Receipt
              </DialogTitle>
              <p className="text-xs font-mono text-[var(--text-muted)] dark:text-slate-400 mt-0.5">
                {receiptNo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {previewUrl && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 rounded-lg text-xs"
                onClick={handleOpenExternal}
                title="Open in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                <span>Open</span>
              </Button>
            )}
            <Button
              size="sm"
              className="h-8 px-3 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
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

        {/* Quick Transaction Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-[var(--border-main)] dark:border-slate-800/60 text-xs">
          <div>
            <span className="text-[var(--text-muted)] dark:text-slate-400 block text-[11px]">
              Resident
            </span>
            <span className="font-semibold text-[var(--text-main)] dark:text-white truncate block">
              {tenantName}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] dark:text-slate-400 block text-[11px]">
              Amount Paid
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono block">
              {formatINR(amount)}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] dark:text-slate-400 block text-[11px]">
              Payment Date
            </span>
            <span className="font-medium text-[var(--text-main)] dark:text-slate-200 block">
              {formatDate(paymentDate)}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] dark:text-slate-400 block text-[11px]">
              Method
            </span>
            <span className="font-semibold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-300 block">
              {String(paymentMethod)}
            </span>
          </div>
        </div>

        {/* Document Preview Area */}
        <div className="relative max-h-[60vh] min-h-[360px] overflow-y-auto p-4 bg-slate-100/60 dark:bg-slate-950/80 flex items-center justify-center">
          {previewUrl && !imageError ? (
            <div className="relative w-full flex flex-col items-center">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center min-h-[300px]">
                  <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={`Receipt ${receiptNo}`}
                className={`w-full max-w-lg rounded-xl shadow-lg border border-[var(--border-main)] dark:border-slate-800 transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            // Digital Voucher Fallback when direct render isn't available
            <div className="w-full max-w-md rounded-2xl border border-[var(--border-main)] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-main)] dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-black text-lg text-[var(--text-main)] dark:text-white">
                    PGinfo Receipt
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] dark:text-slate-400">
                    Official Payment Confirmation
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  PAID
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                  <span className="text-[var(--text-muted)] dark:text-slate-400">Receipt No:</span>
                  <span className="font-mono font-bold text-[var(--text-main)] dark:text-white">
                    {receiptNo}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                  <span className="text-[var(--text-muted)] dark:text-slate-400">Resident:</span>
                  <span className="font-semibold text-[var(--text-main)] dark:text-white">
                    {tenantName} {roomInfo ? `(${roomInfo})` : ''}
                  </span>
                </div>
                {tenantPhone && (
                  <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                    <span className="text-[var(--text-muted)] dark:text-slate-400">Phone:</span>
                    <span className="font-mono text-[var(--text-main)] dark:text-white">
                      {tenantPhone}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                  <span className="text-[var(--text-muted)] dark:text-slate-400">Date:</span>
                  <span className="font-medium text-[var(--text-main)] dark:text-white">
                    {formatDate(paymentDate)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                  <span className="text-[var(--text-muted)] dark:text-slate-400">Method:</span>
                  <span className="font-semibold uppercase text-[var(--text-main)] dark:text-white">
                    {String(paymentMethod)}
                  </span>
                </div>
                <div className="flex justify-between py-2 items-center">
                  <span className="text-sm font-bold text-[var(--text-main)] dark:text-white">
                    Total Amount Paid:
                  </span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatINR(amount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
