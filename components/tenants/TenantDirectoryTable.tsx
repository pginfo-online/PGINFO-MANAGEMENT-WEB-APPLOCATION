"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Megaphone,
  UserPlus,
  Coins,
  ChevronDown,
  SlidersHorizontal,
  Plus,
  Phone,
  MessageSquare,
  ExternalLink,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatINR, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TenantDirectoryTable() {
  const { selectedPropertyId } = usePropertyStore();
  const { setAddRentDuesOpen, setSelectedTenantForDue, setAnnouncementsOpen } =
    useUiStore();

  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: residentsData, isLoading, refetch } = useQuery({
    queryKey: ["residents", selectedPropertyId, search, statusFilter],
    queryFn: () =>
      api.residents.list({
        propertyId: selectedPropertyId || undefined,
        search: search || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      }),
  });

  const residents = residentsData?.data || [];

  const handleOpenWhatsApp = (mobile: string, name: string) => {
    const cleanMobile = mobile.replace(/\D/g, "");
    const url = `https://wa.me/91${cleanMobile}?text=Hello%20${encodeURIComponent(
      name
    )},%20this%20is%20from%20PgInfo%20Management.`;
    window.open(url, "_blank");
  };

  const handleCall = (mobile: string) => {
    window.location.href = `tel:${mobile}`;
  };

  const handleAddDueClick = (tenant: any) => {
    setSelectedTenantForDue(tenant);
    setAddRentDuesOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header Strip matching ref-5 */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>Tenants Overview</span>
            <ChevronUp className="h-5 w-5 text-slate-400" />
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search Box with ⌘F */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search your tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl bg-white border border-slate-200 pl-9 pr-12 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
            <kbd className="absolute right-2.5 top-2 rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 font-medium">
              ⌘ F
            </kbd>
          </div>

          {/* Announcements Button */}
          <button
            onClick={() => setAnnouncementsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Megaphone className="h-3.5 w-3.5 text-blue-600" />
            <span>Announcements</span>
          </button>

          {/* Add Tenant Button */}
          <Link
            href="/people/tenants/addTenant"
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Tenant</span>
          </Link>

          {/* KYC Credits Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold">
            <Coins className="h-4 w-4 text-amber-600" />
            <span>KYC Credits: 5</span>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Row matching ref-5 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xl font-bold text-blue-600 block">{residents.length}</span>
          <span className="text-xs font-medium text-slate-500">Total Tenants</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xl font-bold text-emerald-600 block">
            {
              residents.filter(
                (r) =>
                  r.status === "PENDING_MOVE_IN" ||
                  (r.createdAt &&
                    new Date().getTime() - new Date(r.createdAt).getTime() <
                      30 * 24 * 3600 * 1000)
              ).length
            }
          </span>
          <span className="text-xs font-medium text-slate-500">New Tenants</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xl font-bold text-rose-600 block">0</span>
          <span className="text-xs font-medium text-slate-500">Eviction Requests</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xl font-bold text-amber-600 block">
            {residents.filter((r) => r.status === "NOTICE_PERIOD").length}
          </span>
          <span className="text-xs font-medium text-slate-500">Under Notice</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xl font-bold text-amber-500 block">
            {residents.filter((r) => r.status === "PENDING_MOVE_IN").length}
          </span>
          <span className="text-xs font-medium text-slate-500">Joining Requests</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xl font-bold text-slate-500 block">
            {residents.filter((r) => !r.mobile || r.mobile.length < 5).length}
          </span>
          <span className="text-xs font-medium text-slate-500">Contact Not Added</span>
        </div>
      </div>

      {/* Filters and Results Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-bold text-slate-900">
            {residents.length} Results
          </span>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition">
              <span>KYC Status</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition">
              <span>Move In Date</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition">
              <span>Tenant Status</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Table matching ref-5 */}
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">NAME ↑↓</th>
                  <th className="py-3.5 px-6">ROOM ↑↓</th>
                  <th className="py-3.5 px-6">RENT ↑↓</th>
                  <th className="py-3.5 px-6">CHECK OUT DATE ↑↓</th>
                  <th className="py-3.5 px-6">DUES ↑</th>
                  <th className="py-3.5 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                      <span>Loading active tenants...</span>
                    </td>
                  </tr>
                ) : residents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No tenants found matching your filter.
                    </td>
                  </tr>
                ) : (
                  residents.map((r) => {
                    const duesDisplay = r.dues && r.dues > 0 ? formatINR(r.dues) : "₹0";
                    const isOverdue = r.isOverdue || false;

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/70 transition group"
                      >
                        {/* Name */}
                        <td className="py-4 px-6">
                          <Link
                            href={`/people/tenants/${r.id}`}
                            className="flex items-center gap-3"
                          >
                            <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-sm shadow-xs group-hover:ring-2 group-hover:ring-blue-400 transition">
                              {r.firstName.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                              {r.firstName} {r.lastName || ""}
                            </span>
                          </Link>
                        </td>

                        {/* Room */}
                        <td className="py-4 px-6 text-slate-700 font-medium">
                          {r.room?.roomNumber
                            ? `${r.room.roomNumber}${r.bed?.bedNumber ? ` ${r.bed.bedNumber}` : ""}`
                            : "Unassigned"}
                        </td>

                        {/* Rent */}
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {formatINR(r.monthlyRent)}
                        </td>

                        {/* Check Out Date */}
                        <td className="py-4 px-6 text-slate-600 text-xs">
                          {formatDate(r.expectedVacatingDate || r.agreementEndDate)}
                        </td>

                        {/* Dues */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "font-bold text-sm",
                                isOverdue ? "text-rose-600" : "text-emerald-600"
                              )}
                            >
                              {duesDisplay}
                            </span>
                            <button
                              onClick={() => handleAddDueClick(r)}
                              title="View due details"
                              className="text-slate-400 hover:text-blue-600 transition"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* + Dues button */}
                            <button
                              onClick={() => handleAddDueClick(r)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Dues</span>
                            </button>

                            {/* Phone call */}
                            <button
                              onClick={() => handleCall(r.mobile)}
                              title={`Call ${r.mobile}`}
                              className="h-8 w-8 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 flex items-center justify-center transition cursor-pointer"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </button>

                            {/* WhatsApp chat */}
                            <button
                              onClick={() => handleOpenWhatsApp(r.mobile, r.firstName)}
                              title={`WhatsApp ${r.mobile}`}
                              className="h-8 w-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition cursor-pointer"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
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
    </div>
  );
}
