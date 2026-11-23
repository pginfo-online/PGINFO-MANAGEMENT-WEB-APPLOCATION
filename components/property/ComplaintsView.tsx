"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Plus,
  Bot,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Phone,
  MessageSquare,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import { QueryError, Skeleton } from "../layout/WorkspaceUI";

export default function ComplaintsView() {
  const { selectedPropertyId } = usePropertyStore();
  const { setAddComplaintOpen } = useUiStore();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: complaintsData, isLoading, error, refetch } = useQuery({
    queryKey: ["complaints", selectedPropertyId, statusFilter],
    queryFn: () =>
      api.complaints.list({
        propertyId: selectedPropertyId || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: 50,
      }),
  });

  const complaints = complaintsData?.data || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.complaints.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success("Complaint status updated!");
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update complaint status");
    },
  });

  const statuses = [
    { id: "ALL", label: "All Tickets" },
    { id: "RECEIVED", label: "Received" },
    { id: "VERIFIED", label: "Verified" },
    { id: "TEAM_WORKING", label: "Team Working" },
    { id: "NEED_MORE_TIME", label: "Need More Time" },
    { id: "RESOLVED", label: "Resolved" },
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Maintenance Complaints</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tenant service tickets, SLAs, plumber/electrician assignments, and resolutions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddComplaintOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Complaint</span>
          </button>

        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-200 pb-2">
        {statuses.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer",
              statusFilter === s.id
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Ticket Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {error ? <QueryError error={error} retry={() => void refetch()} /> : isLoading ? (
          <Skeleton count={4} />
        ) : complaints.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80">
            No complaints found for selected status filter.
          </div>
        ) : (
          complaints.map((c) => (
            <div
              key={c.id}
              className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {c.category?.name || "Maintenance"}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        c.urgency === "CRITICAL"
                          ? "bg-rose-100 text-rose-700"
                          : c.urgency === "HIGH"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-700"
                      )}
                    >
                      {c.urgency} Urgency
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formatDate(c.createdAt)}
                  </span>
                </div>

                <div className="mt-3">
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {c.description}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span>📍</span>
                    <span>{c.location || `Room ${c.room?.roomNumber || "101"}`}</span>
                  </p>
                </div>
              </div>

              {/* Status & Transitions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Status:</span>
                  <select
                    value={c.status}
                    onChange={(e) =>
                      updateStatusMutation.mutate({
                        id: c.id,
                        status: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 py-1 px-2.5 text-xs font-bold bg-white text-slate-800"
                  >
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="TEAM_WORKING">TEAM WORKING</option>
                    <option value="NEED_MORE_TIME">NEED MORE TIME</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>

                <button
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: c.id,
                      status: "RESOLVED",
                    })
                  }
                  disabled={c.status === "RESOLVED"}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-40 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mark Resolved</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
