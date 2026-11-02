"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Receipt,
  Users,
  AlertTriangle,
  CalendarCheck,
  Copy,
  ChevronRight,
  ChevronLeft,
  Info,
  ChevronDown,
  UserPlus,
  Zap,
  PlusCircle,
  FileText,
  Megaphone,
  Share2,
  Building2,
  Plus,
  X,
} from "lucide-react";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function OverviewHome() {
  const { selectedPropertyId, setSelectedPropertyId } = usePropertyStore();
  const {
    setAddRentDuesOpen,
    setReceivePaymentOpen,
    setAddExpenseOpen,
    setAnnouncementsOpen,
    setAddPropertyOpen,
  } = useUiStore();

  const [liveStatus, setLiveStatus] = useState("Live");

  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ["dashboardMetrics", selectedPropertyId],
    queryFn: () => api.dashboard.getMetrics(selectedPropertyId || undefined),
  });

  const {
    data: propertiesData,
    isLoading: isPropertiesLoading,
    isError: isPropertiesError,
  } = useQuery({
    queryKey: ["properties"],
    queryFn: () => api.properties.list(),
  });

  const properties = propertiesData?.data || [];
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const displayedProperties = selectedPropertyId
    ? properties.filter((p) => p.id === selectedPropertyId)
    : properties;

  const handleCopyRentOkId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("RentOk ID copied to clipboard!");
  };

  const handleCopyInviteLink = () => {
    const inviteId = selectedProperty?.id?.slice(0, 8).toUpperCase() || "DEMO";
    navigator.clipboard.writeText(`https://pginfo.app/join?id=${inviteId}`);
    toast.success("Tenant self-onboarding invite link copied!");
  };

  const op = metrics?.operational;
  const fin = metrics?.financial;

  // Current month name
  const currentMonthName = new Date().toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <button
            title="Overview information"
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <Info className="h-4 w-4" />
          </button>

          {/* Active Filter Pill */}
          {selectedPropertyId && selectedProperty && (
            <div className="flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
              <Building2 className="h-3 w-3" />
              <span>{selectedProperty.name}</span>
              <button
                onClick={() => setSelectedPropertyId(null, "All Properties")}
                className="hover:text-blue-900 transition ml-1"
                title="Clear filter"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Live Status Pill & New Property Shortcut */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddPropertyOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Property</span>
          </button>

          <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{liveStatus}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        </div>
      </div>

      {!isPropertiesLoading && !isPropertiesError && properties.length === 0 && (
        <section
          aria-labelledby="workspace-setup-title"
          className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-indigo-50 shadow-xs"
        >
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700">
                <Building2 className="h-3.5 w-3.5" />
                Your workspace is ready
              </div>
              <h2
                id="workspace-setup-title"
                className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
              >
                Let’s add your first property
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Create a PG, hostel, or apartment to start organizing rooms,
                residents, and rent in one place. You can update these details
                any time.
              </p>
              <ol className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                <li className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    1
                  </span>
                  Add property details
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                    2
                  </span>
                  Add rooms and beds
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                    3
                  </span>
                  Welcome your residents
                </li>
              </ol>
            </div>
            <button
              type="button"
              onClick={() => setAddPropertyOpen(true)}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 lg:w-auto"
            >
              <Plus className="h-4 w-4" />
              Create your first property
            </button>
          </div>
        </section>
      )}

      {/* 5 Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: View Detailed Dashboard */}
        <Link
          href="/analytics"
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition flex flex-col justify-between group cursor-pointer"
        >
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm font-semibold text-slate-800 leading-snug">
              View Detailed<br />Dashboard
            </span>
            <ChevronRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Card 2: Today's Collection */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="text-2xl mb-1">💵</div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {isMetricsLoading ? "..." : fin?.todayCollectedFormatted || "₹0"}
            </div>
            <span className="text-xs font-medium text-slate-500">Todays Collection</span>
          </div>
        </div>

        {/* Card 3: Month's Collection */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="text-2xl mb-1">💵</div>
          <div>
            <div className="text-xl font-bold text-emerald-600">
              {isMetricsLoading
                ? "..."
                : fin?.monthCollectedFormatted || fin?.totalCollectedFormatted || "₹0"}
            </div>
            <span className="text-xs font-medium text-slate-500">{currentMonthName} Collection</span>
          </div>
        </div>

        {/* Card 4: Month's Dues */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="text-2xl mb-1">🧾</div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {isMetricsLoading
                ? "..."
                : fin?.monthBilledFormatted || fin?.totalBilledFormatted || "₹0"}
            </div>
            <span className="text-xs font-medium text-slate-500">{currentMonthName} Dues</span>
          </div>
        </div>

        {/* Card 5: All Time Dues */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="text-2xl mb-1">🧾</div>
          <div>
            <div className="text-xl font-bold text-rose-600">
              {isMetricsLoading
                ? "..."
                : fin?.outstandingBalanceFormatted || "₹0"}
            </div>
            <span className="text-xs font-medium text-slate-500">All Time Dues</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Quick Action Bar
          </span>
          <span className="text-xs text-slate-400">Perform instant tasks</span>
        </div>
        <div className="flex items-center gap-2 pt-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setAddPropertyOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition whitespace-nowrap cursor-pointer"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Add Property</span>
          </button>
          <Link
            href="/people/tenants/addTenant"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition whitespace-nowrap"
          >
            <UserPlus className="h-3.5 w-3.5 text-blue-600" />
            <span>Add Tenant</span>
          </Link>
          <button
            onClick={() => setReceivePaymentOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition whitespace-nowrap cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 text-emerald-600" />
            <span>Receive Payment</span>
          </button>
          <button
            onClick={() => setAddRentDuesOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5 text-blue-600" />
            <span>Add Due</span>
          </button>
          <button
            onClick={() => setAddExpenseOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition whitespace-nowrap cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-rose-600" />
            <span>Record Expense</span>
          </button>
          <button
            onClick={() => setAnnouncementsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition whitespace-nowrap cursor-pointer"
          >
            <Megaphone className="h-3.5 w-3.5 text-purple-600" />
            <span>Broadcast</span>
          </button>
          <button
            onClick={handleCopyInviteLink}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition whitespace-nowrap cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 text-amber-600" />
            <span>Send Invite</span>
          </button>
        </div>
      </div>

      {/* Property Overview Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Property Overview</h2>
            <span className="text-xs text-slate-400 font-medium">
              ({displayedProperties.length} {displayedProperties.length === 1 ? "property" : "properties"})
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            {selectedPropertyId && (
              <button
                onClick={() => setSelectedPropertyId(null, "All Properties")}
                className="text-xs text-blue-600 hover:underline mr-2 cursor-pointer"
              >
                Show All
              </button>
            )}
            <button
              onClick={() => setAddPropertyOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Property</span>
            </button>
          </div>
        </div>

        {/* Dynamic Property Cards or Empty State */}
        {displayedProperties.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/80 text-center shadow-xs">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Building2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Properties Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              {selectedPropertyId
                ? "The selected property could not be found."
                : "Your organization does not have any properties registered yet. Add your first PG or flat to start managing rooms, beds, and tenants."}
            </p>
            <button
              onClick={() => setAddPropertyOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Register First Property</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {displayedProperties.map((prop) => {
              const rentOkId = prop.id.slice(0, 8).toUpperCase();
              const isSelected = selectedPropertyId === prop.id;

              return (
                <div
                  key={prop.id}
                  className={`p-6 rounded-3xl bg-white border shadow-xs hover:shadow-md transition ${
                    isSelected ? "border-blue-500 ring-2 ring-blue-500/10" : "border-slate-200/80"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{prop.name}</h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                          {prop.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <span>RentOk Id: {rentOkId}</span>
                        <button
                          onClick={() => handleCopyRentOkId(rentOkId)}
                          className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          title="Copy ID"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-slate-300">·</span>
                        <span>{prop.city || "Pune"}</span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedPropertyId(
                          isSelected ? null : prop.id,
                          isSelected ? "All Properties" : prop.name
                        )
                      }
                      className={`text-xs font-semibold px-3 py-1 rounded-xl transition cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </button>
                  </div>

                  {/* Occupied Beds Progress Bar */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Occupied Beds</span>
                      <span>
                        {prop.occupiedBeds ?? 0}/{prop.totalBeds ?? 0}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            prop.totalBeds && prop.totalBeds > 0
                              ? Math.round(((prop.occupiedBeds ?? 0) / prop.totalBeds) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Metric Items */}
                  <div className="mt-6 space-y-3.5 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                          <Users className="h-4 w-4" />
                        </div>
                        <span>Active Tenants</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {prop.activeTenants ?? prop.currentResidents ?? 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <div className="h-7 w-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <span>Under Eviction</span>
                      </div>
                      <span className="font-bold text-slate-900">0</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                          <CalendarCheck className="h-4 w-4" />
                        </div>
                        <span>Current Bookings</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {prop.bookingsCount ?? 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                          <Receipt className="h-4 w-4" />
                        </div>
                        <span>Pending Dues</span>
                      </div>
                      <span className="font-bold text-rose-600">
                        {prop.pendingDuesFormatted || "₹0"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
