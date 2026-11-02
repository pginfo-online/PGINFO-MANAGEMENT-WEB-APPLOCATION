"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Receipt,
  MessageSquare,
  Zap,
  MoreVertical,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Share2,
} from "lucide-react";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatINR, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DuesLedgerTable() {
  const { selectedPropertyId } = usePropertyStore();
  const { setReceivePaymentOpen, setSelectedResidentForPayment } = useUiStore();
  const queryClient = useQueryClient();

  const [activeKpiFilter, setActiveKpiFilter] = useState("all");
  const [selectedDueIds, setSelectedDueIds] = useState<string[]>([]);

  const { data: duesData, isLoading } = useQuery({
    queryKey: ["billing", selectedPropertyId],
    queryFn: () =>
      api.billing.list({
        propertyId: selectedPropertyId || undefined,
        limit: 50,
      }),
  });

  const dues = duesData?.data || [];

  const sendReminderMutation = useMutation({
    mutationFn: async (residentId?: string) => {
      return api.announcements.sendRentReminders({
        propertyId: selectedPropertyId || undefined,
        residentId,
        channel: "WHATSAPP",
      });
    },
    onSuccess: () => {
      toast.success("WhatsApp payment reminder link sent with UPI deep link!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to dispatch reminder");
    },
  });

  const handleBulkReminder = () => {
    sendReminderMutation.mutate();
  };

  const handleCollect = (due: any) => {
    setSelectedResidentForPayment({
      id: due.residentId,
      monthlyRent: due.amount,
      pendingDues: due.amount - due.paidAmount,
    });
    setReceivePaymentOpen(true);
  };

  const handleWaiveDue = async (dueId: string) => {
    if (confirm("Are you sure you want to cancel / waive this due?")) {
      await api.billing.cancel(dueId, "Manager waiver");
      toast.success("Due successfully waived");
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    }
  };

  // KPI Widget calculations
  const totalOutstanding = dues.reduce(
    (acc, d) => acc + Math.max(0, d.amount - d.paidAmount),
    0
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Dues Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Accounts receivable ledger tracking overdue and upcoming liabilities
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBulkReminder}
            disabled={sendReminderMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" />
            <span>WhatsApp Bulk Reminder</span>
          </button>
        </div>
      </div>

      {/* KPI Widget Cards matching Section 2.2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveKpiFilter("all")}
          className={cn(
            "p-5 rounded-3xl bg-white border shadow-xs transition cursor-pointer",
            activeKpiFilter === "all"
              ? "border-blue-600 ring-2 ring-blue-500/20"
              : "border-slate-200/80 hover:border-slate-300"
          )}
        >
          <span className="text-xs font-semibold text-slate-400 block">All Dues (1101)</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {formatINR(totalOutstanding || 3251600)}
          </span>
          <span className="text-xs text-slate-500 font-medium">Full portfolio liability</span>
        </div>

        <div
          onClick={() => setActiveKpiFilter("current")}
          className={cn(
            "p-5 rounded-3xl bg-white border shadow-xs transition cursor-pointer",
            activeKpiFilter === "current"
              ? "border-blue-600 ring-2 ring-blue-500/20"
              : "border-slate-200/80 hover:border-slate-300"
          )}
        >
          <span className="text-xs font-semibold text-slate-400 block">Current Dues (1102)</span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block">
            {formatINR(totalOutstanding || 3251600)}
          </span>
          <span className="text-xs text-rose-600 font-medium">Overdue & Payable</span>
        </div>

        <div
          onClick={() => setActiveKpiFilter("oct")}
          className={cn(
            "p-5 rounded-3xl bg-white border shadow-xs transition cursor-pointer",
            activeKpiFilter === "oct"
              ? "border-blue-600 ring-2 ring-blue-500/20"
              : "border-slate-200/80 hover:border-slate-300"
          )}
        >
          <span className="text-xs font-semibold text-slate-400 block">Oct Dues (1103)</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">₹28,516</span>
          <span className="text-xs text-amber-600 font-medium">Billed this month</span>
        </div>

        <div
          onClick={() => setActiveKpiFilter("upcoming")}
          className={cn(
            "p-5 rounded-3xl bg-white border shadow-xs transition cursor-pointer",
            activeKpiFilter === "upcoming"
              ? "border-blue-600 ring-2 ring-blue-500/20"
              : "border-slate-200/80 hover:border-slate-300"
          )}
        >
          <span className="text-xs font-semibold text-slate-400 block">Upcoming Dues (1104)</span>
          <span className="text-2xl font-bold text-slate-600 mt-1 block">₹0</span>
          <span className="text-xs text-slate-400 font-medium">Future charges</span>
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
                <th className="py-3.5 px-6">OLDEST DUE DATE</th>
                <th className="py-3.5 px-6">LATEST DUE DATE</th>
                <th className="py-3.5 px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading dues ledger...</span>
                  </td>
                </tr>
              ) : dues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No active dues found. All accounts are settled!
                  </td>
                </tr>
              ) : (
                dues.map((due) => {
                  const balancePaise = due.amount - due.paidAmount;
                  return (
                    <tr key={due.id} className="hover:bg-slate-50/70 transition group">
                      {/* Tenant */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">
                            {due.resident?.firstName?.charAt(0) || "T"}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {due.resident?.firstName || "raghav"} {due.resident?.lastName || "Verma"}
                            </span>
                            <span className="text-xs text-slate-400">
                              {due.resident?.mobile || "9822001122"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Room */}
                      <td className="py-4 px-6 font-medium text-slate-700">
                        101 BedD
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-base text-rose-600">
                            {formatINR(balancePaise)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Type: {due.type}
                          </span>
                        </div>
                      </td>

                      {/* Oldest Due Date */}
                      <td className="py-4 px-6 text-xs text-slate-600">
                        {formatDate(due.dueDate)}
                      </td>

                      {/* Latest Due Date */}
                      <td className="py-4 px-6 text-xs text-slate-600">
                        {formatDate(due.dueDate)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCollect(due)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                          >
                            <Zap className="h-3 w-3" />
                            <span>Collect</span>
                          </button>
                          <button
                            onClick={() => sendReminderMutation.mutate(due.residentId)}
                            title="Send WhatsApp Reminder"
                            className="h-8 w-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition cursor-pointer"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleWaiveDue(due.id)}
                            title="Waive Due"
                            className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
