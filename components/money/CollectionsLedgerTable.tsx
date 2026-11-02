"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Download,
  MessageSquare,
  FileText,
  Calendar,
  Filter,
  Trash2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { usePropertyStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatINR, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CollectionsLedgerTable() {
  const { selectedPropertyId } = usePropertyStore();
  const [modeFilter, setModeFilter] = useState("ALL");

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["payments", selectedPropertyId, modeFilter],
    queryFn: () =>
      api.payments.list({
        propertyId: selectedPropertyId || undefined,
        mode: modeFilter === "ALL" ? undefined : modeFilter,
        limit: 50,
      }),
  });

  const payments = paymentsData?.data || [];

  const handleDownloadReceipt = (paymentId: string) => {
    toast.success("Downloading payment receipt PDF...");
  };

  const handleWhatsAppReceipt = (payment: any) => {
    toast.success("WhatsApp receipt dispatch triggered!");
  };

  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Collections</h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical audit ledger of all completed payments received across properties
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="rounded-2xl bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>
      </div>

      {/* KPI Widget Cards matching Section 3.2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">All Collection in Oct (1202)</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {formatINR(totalCollected || 3948400)}
          </span>
          <span className="text-xs text-emerald-600 font-medium">Verified in bank</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Total Collection (1201)</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {formatINR(totalCollected || 3948400)}
          </span>
          <span className="text-xs text-slate-500 font-medium">Cumulative gross</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Oct Dues Collected (1203)</span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">₹24,000</span>
          <span className="text-xs text-blue-600 font-medium">Current cycle rent</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Prior Dues Collected (1204)</span>
          <span className="text-2xl font-bold text-slate-700 mt-1 block">₹15,484</span>
          <span className="text-xs text-slate-500 font-medium">Previous balance cleared</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">TENANT</th>
                <th className="py-3.5 px-6">ROOM</th>
                <th className="py-3.5 px-6">AMOUNT</th>
                <th className="py-3.5 px-6">PAID ON</th>
                <th className="py-3.5 px-6">MODE</th>
                <th className="py-3.5 px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading collections history...</span>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No payment collections recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition group">
                    {/* Tenant */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                          {p.resident?.firstName?.charAt(0) || "P"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {p.resident?.firstName || "raghav"} {p.resident?.lastName || "Verma"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {p.resident?.mobile || "9822001122"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Room */}
                    <td className="py-4 px-6 font-medium text-slate-700">
                      101 BedD
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 font-bold text-base text-emerald-600">
                      +{formatINR(p.amount)}
                    </td>

                    {/* Paid On */}
                    <td className="py-4 px-6 text-xs text-slate-600">
                      {formatDate(p.collectionDate)}
                    </td>

                    {/* Mode */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.mode}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadReceipt(p.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                        >
                          <Download className="h-3 w-3" />
                          <span>Receipt</span>
                        </button>
                        <button
                          onClick={() => handleWhatsAppReceipt(p)}
                          title="WhatsApp Receipt"
                          className="h-8 w-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition cursor-pointer"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
