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
import { QueryError, Skeleton } from "../layout/WorkspaceUI";

export default function DuesLedgerTable() {
  const { selectedPropertyId } = usePropertyStore();
  const { setSelectedResidentForPayment } = useUiStore();
  const queryClient = useQueryClient();

  const [pagination, setPagination] = useState({ propertyId: selectedPropertyId, page: 1 });
  const page = pagination.propertyId === selectedPropertyId ? pagination.page : 1;
  const { data: duesData, isLoading, error, refetch } = useQuery({
    queryKey: ["billing", selectedPropertyId, page],
    queryFn: () => api.billing.list({ propertyId: selectedPropertyId ?? undefined, page, limit: 25 }),
  });
  const dues = duesData?.data ?? [];

  const sendReminderMutation = useMutation({
    mutationFn: async (residentId?: string) => {
      return api.announcements.sendRentReminders({
        propertyId: selectedPropertyId || undefined,
        residentId,
        channel: "WHATSAPP",
      });
    },
    onSuccess: (result) => {
      const status = `${result.remindersSent} reminders accepted · ${result.failedCount} failures`;
      if (result.whatsappError) toast.error(result.whatsappError);
      else toast.info(status);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to dispatch reminder");
    },
  });

  const handleBulkReminder = () => {
    if (confirm("Send WhatsApp rent reminders to eligible tenants in this scope?")) sendReminderMutation.mutate();
  };

  const handleCollect = (due: any) => {
    setSelectedResidentForPayment({ ...due.resident, id: due.residentId, billingRecordId: due.id });
  };

  const handleWaiveDue = async (dueId: string) => {
    if (confirm("Are you sure you want to cancel / waive this due?")) {
      try {
        await api.billing.cancel(dueId, "Manager waiver");
      toast.success("Due successfully waived");
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      void queryClient.invalidateQueries({ queryKey: ["money"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not waive the due.");
      }
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing records</h1>
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

      {error && <QueryError error={error} retry={() => void refetch()} />}
      {/* Table Section */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">TENANT</th>
                <th className="py-3.5 px-6">ROOM</th>
                <th className="py-3.5 px-6">AMOUNT</th>
                <th className="py-3.5 px-6">DUE DATE</th>
                <th className="py-3.5 px-6">STATUS</th>
                <th className="py-3.5 px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Skeleton count={4} />
                  </td>
                </tr>
              ) : dues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No billing records in this view.
                  </td>
                </tr>
              ) : (
                dues.map((due) => {
                  const balancePaise = ["PAID", "CANCELLED", "DRAFT"].includes(due.status) ? 0 : Math.max(0, due.amount - due.paidAmount);
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
                              {due.resident?.firstName || "Resident"} {due.resident?.lastName}
                            </span>
                            <span className="text-xs text-slate-400">
                              {due.resident?.mobile}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Room */}
                      <td className="py-4 px-6 font-medium text-slate-700">
                        {due.resident?.room?.roomNumber ?? "—"}
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
                        {due.status.replaceAll("_", " ")}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {balancePaise > 0 && <div className="flex items-center justify-end gap-2">
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
                        </div>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {(page > 1 || duesData?.meta.hasMore) && <div className="flex justify-end gap-2">
        <button className="workspace-button" disabled={page === 1} onClick={() => setPagination({ propertyId: selectedPropertyId, page: page - 1 })}>Previous</button>
        <button className="workspace-button" disabled={!duesData?.meta.hasMore} onClick={() => setPagination({ propertyId: selectedPropertyId, page: page + 1 })}>Next</button>
      </div>}
    </div>
  );
}
