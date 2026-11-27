"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Ban, CalendarDays, Phone, Plus, Search, UserCheck } from "lucide-react";
import { usePropertyStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatINR, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { PageHeading, QueryError, Skeleton } from "../layout/WorkspaceUI";

const statusStyles: Record<string, string> = {
  CONFIRMED: "bg-amber-50 text-amber-700 border-amber-200",
  CHECKED_IN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  EXPIRED: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function BookingsView() {
  const queryClient = useQueryClient();
  const { selectedPropertyId } = usePropertyStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pagination, setPagination] = useState({ propertyId: selectedPropertyId, page: 1 });
  const page = selectedPropertyId === pagination.propertyId ? pagination.page : 1;

  const bookingsQuery = useQuery({
    queryKey: ["bookings", selectedPropertyId, page],
    queryFn: () => api.bookings.list({ propertyId: selectedPropertyId ?? undefined, page }),
  });

  const bookings = useMemo(() => {
    const list = bookingsQuery.data?.data ?? [];
    return list.filter((b: any) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        const matchName = b.guestName?.toLowerCase().includes(s);
        const matchMobile = b.guestMobile?.includes(s);
        if (!matchName && !matchMobile) return false;
      }
      return true;
    });
  }, [bookingsQuery.data?.data, search, statusFilter]);

  const cancelBookingMutation = useMutation({
    mutationFn: (id: string) => api.bookings.cancel(id),
    onSuccess: () => {
      toast.success("Booking cancelled & slot released");
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to cancel booking");
    },
  });

  if (bookingsQuery.isPending) return <Skeleton layout="cards" count={4} />;
  if (bookingsQuery.error) {
    return <QueryError error={bookingsQuery.error} retry={() => void bookingsQuery.refetch()} />;
  }

  return (
    <div className="space-y-5 pb-16">
      <PageHeading
        title="Room Reservations & Bookings"
        description="Track pre-move-in bed holds with advance token amounts."
        action={
          <Link href="/people/tenants/addTenant" className="workspace-button primary">
            <Plus className="size-4" />
            <span>New Reservation</span>
          </Link>
        }
      />

      {/* Search & Status Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="workspace-search max-w-sm">
          <Search className="size-4" />
          <input
            aria-label="Search bookings"
            placeholder="Search by guest name or mobile"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Booking status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="workspace-button"
        >
          <option value="ALL">All statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CHECKED_IN">Checked in</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <span className="ml-auto text-sm text-slate-600">{bookings.length} results</span>
      </div>

      {bookings.length === 0 ? (
        <div className="workspace-card p-8 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-medium text-slate-700">
            {search || statusFilter !== "ALL"
              ? "No bookings match these filters."
              : "No room reservations yet."}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Advance bookings will appear here once created.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-5">GUEST NAME</th>
                    <th className="py-3.5 px-5">PHONE</th>
                    <th className="py-3.5 px-5">PROPERTY / BED</th>
                    <th className="py-3.5 px-5">TOKEN ADVANCE</th>
                    <th className="py-3.5 px-5">EXPECTED CHECK-IN</th>
                    <th className="py-3.5 px-5">STATUS</th>
                    <th className="py-3.5 px-5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {bookings.map((b: any) => {
                    const badgeClass =
                      statusStyles[b.status] ?? "bg-slate-100 text-slate-700 border-slate-200";
                    const checkInHref = `/people/tenants/addTenant?name=${encodeURIComponent(b.guestName || "")}&mobile=${encodeURIComponent(b.guestMobile || "")}${b.propertyId ? `&propertyId=${b.propertyId}` : ""}${b.roomId ? `&roomId=${b.roomId}` : ""}${b.bedId ? `&bedId=${b.bedId}` : ""}`;
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-5 font-semibold text-slate-900">
                          {b.guestName}
                        </td>
                        <td className="py-3.5 px-5 text-slate-700 whitespace-nowrap">
                          <a
                            href={`tel:${b.guestMobile}`}
                            className="inline-flex items-center gap-1.5 hover:text-blue-700"
                          >
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{b.guestMobile}</span>
                          </a>
                        </td>
                        <td className="py-3.5 px-5 text-xs text-slate-600">
                          {[b.property?.name, b.bed?.bedNumber ? `Bed ${b.bed.bedNumber}` : null]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                          {formatINR(b.tokenAmount)}
                        </td>
                        <td className="py-3.5 px-5 text-slate-600 whitespace-nowrap">
                          {formatDate(b.expectedMoveIn)}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}
                          >
                            {b.status.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          {b.status === "CONFIRMED" ? (
                            <div className="inline-flex items-center justify-end gap-2">
                              <Link
                                href={checkInHref}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs transition"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Check-in Now</span>
                              </Link>
                              <button
                                type="button"
                                disabled={cancelBookingMutation.isPending}
                                onClick={() => {
                                  if (confirm("Cancel this booking and release the reserved bed?")) {
                                    cancelBookingMutation.mutate(b.id);
                                  }
                                }}
                                aria-label={`Cancel booking for ${b.guestName}`}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No actions</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
            {bookings.map((b: any) => {
              const badgeClass =
                statusStyles[b.status] ?? "bg-slate-100 text-slate-700 border-slate-200";
              const checkInHref = `/people/tenants/addTenant?name=${encodeURIComponent(b.guestName || "")}&mobile=${encodeURIComponent(b.guestMobile || "")}${b.propertyId ? `&propertyId=${b.propertyId}` : ""}${b.roomId ? `&roomId=${b.roomId}` : ""}${b.bedId ? `&bedId=${b.bedId}` : ""}`;
              return (
                <article key={b.id} className="workspace-card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">{b.guestName}</h2>
                      <a href={`tel:${b.guestMobile}`} className="text-xs text-slate-600 underline">
                        {b.guestMobile}
                      </a>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}>
                      {b.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between text-xs text-slate-600">
                    <span>Token: <strong className="text-emerald-700">{formatINR(b.tokenAmount)}</strong></span>
                    <span>Check-in: {formatDate(b.expectedMoveIn)}</span>
                  </div>
                  {b.status === "CONFIRMED" && (
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <Link href={checkInHref} className="workspace-button primary">
                        Check-in Now
                      </Link>
                      <button
                        type="button"
                        disabled={cancelBookingMutation.isPending}
                        onClick={() => {
                          if (confirm("Cancel this booking?")) cancelBookingMutation.mutate(b.id);
                        }}
                        className="workspace-button text-rose-600"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      {(page > 1 || bookingsQuery.data?.meta.hasMore) && (
        <div className="flex justify-end gap-2">
          <button
            className="workspace-button"
            disabled={page === 1}
            onClick={() => setPagination({ propertyId: selectedPropertyId, page: page - 1 })}
          >
            Previous
          </button>
          <button
            className="workspace-button"
            disabled={!bookingsQuery.data?.meta.hasMore}
            onClick={() => setPagination({ propertyId: selectedPropertyId, page: page + 1 })}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
