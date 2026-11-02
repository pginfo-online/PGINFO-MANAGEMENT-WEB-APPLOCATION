"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  Bed,
  CalendarDays,
  Receipt,
  CreditCard,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  X,
  ArrowRight,
} from "lucide-react";
import { useUiStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { cn, formatINR } from "@/lib/utils";

type SearchTab =
  | "All"
  | "Tenant"
  | "Room"
  | "Booking"
  | "Dues"
  | "Collection"
  | "Complaint"
  | "Leads";

export default function GlobalSearchDialog() {
  const { isSearchOpen, setSearchOpen } = useUiStore();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("All");

  const { data: residentsData } = useQuery({
    queryKey: ["residents", query],
    queryFn: () => api.residents.list({ search: query }),
    enabled: isSearchOpen,
  });

  const { data: roomsData } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const props = await api.properties.list();
      if (!props.data?.length) return [];
      const allRooms = await Promise.all(
        props.data.map((p) => api.rooms.listByProperty(p.id))
      );
      return allRooms.flat();
    },
    enabled: isSearchOpen,
  });

  const { data: duesData } = useQuery({
    queryKey: ["billing"],
    queryFn: () => api.billing.list({ limit: 10 }),
    enabled: isSearchOpen,
  });

  const { data: complaintsData } = useQuery({
    queryKey: ["complaints"],
    queryFn: () => api.complaints.list({ limit: 10 }),
    enabled: isSearchOpen,
  });

  if (!isSearchOpen) return null;

  const residents = residentsData?.data || [];
  const rooms = roomsData || [];
  const dues = duesData?.data || [];
  const complaints = complaintsData?.data || [];

  const tabs: SearchTab[] = [
    "All",
    "Tenant",
    "Room",
    "Booking",
    "Dues",
    "Collection",
    "Complaint",
    "Leads",
  ];

  const hasResults =
    query.trim().length > 0 &&
    (residents.length > 0 || rooms.length > 0 || dues.length > 0 || complaints.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="relative flex-1">
            <input
              type="text"
              autoFocus
              placeholder="Search tenants, rooms, team, dues..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl bg-slate-50 border border-slate-200 pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Tabs Strip */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50/50">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer",
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:bg-slate-200/60 hover:text-slate-800"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Results Area */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
          {!query.trim() ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Search className="h-8 w-8 text-slate-300 stroke-[1.5]" />
              </div>
              <p className="text-sm font-medium text-slate-500">Search anything</p>
              <p className="text-xs text-slate-400 mt-1">
                Type a name, phone number, room or ticket ID
              </p>
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <p className="text-sm font-medium text-slate-600">
                No matching results found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for &quot;Madhav&quot;, &quot;101&quot;, or &quot;raghav&quot;
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tenants Matches */}
              {(activeTab === "All" || activeTab === "Tenant") &&
                residents.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                      Tenants ({residents.length})
                    </span>
                    {residents.map((r) => (
                      <Link
                        key={r.id}
                        href={`/people/tenants/${r.id}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-blue-50/60 border border-slate-100 transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">
                            {r.firstName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                                {r.firstName} {r.lastName || ""}
                              </span>
                              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                {r.status}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">
                              Room {r.room?.roomNumber || "-"} {r.bed?.bedNumber || ""} · {r.mobile}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-700 block">
                            {formatINR(r.monthlyRent)}/mo
                          </span>
                          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition ml-auto" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

              {/* Rooms Matches */}
              {(activeTab === "All" || activeTab === "Room") &&
                rooms.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                      Rooms ({rooms.length})
                    </span>
                    {rooms.map((room) => (
                      <Link
                        key={room.id}
                        href={`/property/rooms/${room.id}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-blue-50/60 border border-slate-100 transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm">
                            <Bed className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                              Room {room.roomNumber} ({room.floor})
                            </span>
                            <span className="text-xs text-slate-500 block">
                              {room.sharingType} · {room.beds?.length || 0} Beds Total
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-700 block">
                            {formatINR(room.rentAmount)}
                          </span>
                          <span className="text-[10px] font-medium text-blue-600">
                            {room.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

              {/* Dues Matches */}
              {(activeTab === "All" || activeTab === "Dues") &&
                dues.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                      Outstanding Dues
                    </span>
                    {dues.map((due) => (
                      <Link
                        key={due.id}
                        href="/money/dues"
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-rose-50/50 border border-slate-100 transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <Receipt className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-slate-900">
                              {due.resident?.firstName || "Resident"} · {due.type}
                            </span>
                            <span className="text-xs text-slate-500 block">
                              Due on {new Date(due.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-rose-600 block">
                            {formatINR(due.amount - due.paidAmount)}
                          </span>
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            {due.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
