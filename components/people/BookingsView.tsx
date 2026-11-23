"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Plus,
  UserCheck,
  Ban,
  Clock,
  Loader2,
} from "lucide-react";
import { usePropertyStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatINR, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import { QueryError, Skeleton } from "../layout/WorkspaceUI";

export default function BookingsView() {
  const queryClient = useQueryClient();
  const { selectedPropertyId } = usePropertyStore();
  const [pagination, setPagination] = useState({ propertyId: selectedPropertyId, page: 1 });
  const page = selectedPropertyId === pagination.propertyId ? pagination.page : 1;
  const bookingsQuery = useQuery({
    queryKey: ["bookings", selectedPropertyId, page],
    queryFn: () => api.bookings.list({ propertyId: selectedPropertyId ?? undefined, page }),
  });
  const bookings = bookingsQuery.data?.data ?? [];

  const cancelBookingMutation = useMutation({
    mutationFn: (id: string) => api.bookings.cancel(id),
    onSuccess: () => {
      toast.success("Booking cancelled & slot released");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to cancel booking");
    },
  });

  if (bookingsQuery.isPending) return <Skeleton />;
  if (bookingsQuery.error) return <QueryError error={bookingsQuery.error} retry={() => void bookingsQuery.refetch()} />;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Room Reservations & Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking pre-move-in bed holds with advance token amounts
          </p>
        </div>

        <Link
          href="/people/tenants/addTenant"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Reservation</span>
        </Link>
      </div>

      {/* Table Section */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">GUEST NAME</th>
                <th className="py-3.5 px-6">PHONE</th>
                <th className="py-3.5 px-6">TOKEN ADVANCE</th>
                <th className="py-3.5 px-6">EXPECTED CHECK-IN</th>
                <th className="py-3.5 px-6">STATUS</th>
                <th className="py-3.5 px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {bookings.map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    {b.guestName}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600">
                    {b.guestMobile}
                  </td>
                  <td className="py-4 px-6 font-bold text-emerald-600">
                    {formatINR(b.tokenAmount)}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                    {formatDate(b.expectedMoveIn)}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      {b.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/people/tenants/addTenant?name=${encodeURIComponent(b.guestName)}&mobile=${b.guestMobile}`}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs transition"
                      >
                        Check-in Now
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm("Cancel this booking?")) {
                            cancelBookingMutation.mutate(b.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button className="workspace-button" disabled={page === 1} onClick={() => setPagination({ propertyId: selectedPropertyId, page: page - 1 })}>Previous</button>
        <button className="workspace-button" disabled={!bookingsQuery.data?.meta.hasMore} onClick={() => setPagination({ propertyId: selectedPropertyId, page: page + 1 })}>Next</button>
      </div>
    </div>
  );
}
