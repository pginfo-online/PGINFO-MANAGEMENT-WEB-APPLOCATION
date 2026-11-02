"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Users,
  ChevronUp,
  ChevronDown,
  Building2,
  Plus,
  X,
} from "lucide-react";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from "recharts";

type DashboardTab =
  | "Bird's View"
  | "Financials"
  | "Occupancy"
  | "Tenant"
  | "Issues"
  | "Custom Dashboard";

export default function DetailedDashboardView() {
  const { selectedPropertyId, setSelectedPropertyId } = usePropertyStore();
  const { setAddPropertyOpen } = useUiStore();
  const [activeTab, setActiveTab] = useState<DashboardTab>("Bird's View");
  const [search, setSearch] = useState("");
  const [showCombined, setShowCombined] = useState(false);

  const { data: metrics } = useQuery({
    queryKey: ["dashboardMetrics", selectedPropertyId],
    queryFn: () => api.dashboard.getMetrics(selectedPropertyId || undefined),
  });

  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => api.properties.list(),
  });

  const properties = propertiesData?.data || [];
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const displayedProperties = selectedPropertyId
    ? properties.filter((p) => p.id === selectedPropertyId)
    : properties;

  const tabs: DashboardTab[] = [
    "Bird's View",
    "Financials",
    "Occupancy",
    "Tenant",
    "Issues",
    "Custom Dashboard",
  ];

  const op = metrics?.operational;
  const fin = metrics?.financial;

  const occupiedBeds = op?.occupiedBeds ?? 0;
  const vacantBeds = op?.availableBeds ?? 0;
  const totalBeds = op?.totalBeds ?? 0;
  const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const currentMonthName = new Date().toLocaleString("default", { month: "long" });

  const occupancyPieData = [
    { name: "Occupied Beds", value: occupiedBeds, color: "#10B981" },
    { name: "Vacant Beds", value: vacantBeds, color: "#94A3B8" },
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Tabs Strip matching ref-4 */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar pt-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative py-3 px-5 text-sm font-semibold whitespace-nowrap transition cursor-pointer",
                isActive
                  ? "text-blue-600 bg-white border-t-2 border-l border-r border-blue-600 rounded-t-2xl shadow-xs"
                  : "text-slate-500 hover:text-slate-900 border-t-2 border-transparent"
              )}
            >
              <span>{tab}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {selectedPropertyId && selectedProperty && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
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
          <span className="text-xs text-slate-500">
            Showing {displayedProperties.length} {displayedProperties.length === 1 ? "property" : "properties"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showCombined}
              onChange={(e) => setShowCombined(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Show combined summary</span>
          </label>

          <button
            onClick={() => setAddPropertyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Bird's View */}
      {activeTab === "Bird's View" && (
        <div>
          {displayedProperties.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/80 text-center shadow-xs">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Properties Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                Register your first PG, hostel, or flat to view detailed bird's eye analytics.
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
                const isSelected = selectedPropertyId === prop.id;
                const propOccupied = prop.occupiedBeds ?? 0;
                const propTotal = prop.totalBeds ?? 0;
                const propVacant = propTotal >= propOccupied ? propTotal - propOccupied : 0;
                const propRooms = prop.roomsCount ?? prop.totalRooms ?? 0;

                return (
                  <div
                    key={prop.id}
                    className={`rounded-3xl bg-white border shadow-xs overflow-hidden transition ${
                      isSelected ? "border-blue-500 ring-2 ring-blue-500/10" : "border-slate-200/80"
                    }`}
                  >
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-indigo-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {prop.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{prop.name}</h3>
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                              {prop.type}
                            </span>
                            {isSelected && (
                              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Selected
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">
                            {prop.city || "India"} · {prop.addressLine1 || ""}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setSelectedPropertyId(
                            isSelected ? null : prop.id,
                            isSelected ? "All Properties" : prop.name
                          )
                        }
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isSelected ? "Filtering" : "Select"}
                      </button>
                    </div>

                    {/* Room / Bed / Tenant Metrics Header */}
                    <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 p-3 bg-slate-50/50 text-center">
                      <div>
                        <span className="text-lg font-bold text-slate-900 block">{propRooms}</span>
                        <span className="text-[11px] font-medium text-slate-500">Rooms</span>
                      </div>
                      <div>
                        <span className="text-lg font-bold text-slate-900 block">{propTotal}</span>
                        <span className="text-[11px] font-medium text-slate-500">Beds</span>
                      </div>
                      <div>
                        <span className="text-lg font-bold text-emerald-600 block">{propOccupied}</span>
                        <span className="text-[11px] font-medium text-slate-500">Occupied</span>
                      </div>
                      <div>
                        <span className="text-lg font-bold text-slate-600 block">{propVacant}</span>
                        <span className="text-[11px] font-medium text-slate-500">Vacant</span>
                      </div>
                    </div>

                    {/* Financial Rows */}
                    <div className="p-5 space-y-4 text-sm font-medium">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-700">
                          <div className="h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                            ₹
                          </div>
                          <span>Today&apos;s Collection</span>
                        </div>
                        <span className="font-bold text-slate-900">
                          {isSelected ? fin?.todayCollectedFormatted || "₹0" : "₹0"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-700">
                          <div className="h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                            ₹
                          </div>
                          <span>{currentMonthName}&apos;s Collection</span>
                        </div>
                        <span className="font-bold text-emerald-600">
                          {isSelected
                            ? fin?.monthCollectedFormatted || fin?.totalCollectedFormatted || "₹0"
                            : prop.monthlyCollectedFormatted || "₹0"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-700">
                          <div className="h-7 w-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold">
                            !
                          </div>
                          <span>Total Outstanding Dues</span>
                        </div>
                        <span className="font-bold text-rose-600">
                          {isSelected ? fin?.outstandingBalanceFormatted || "₹0" : prop.pendingDuesFormatted || "₹0"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-700">
                          <div className="h-7 w-7 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">
                            <Users className="h-3.5 w-3.5" />
                          </div>
                          <span>Active Tenants</span>
                        </div>
                        <span className="font-bold text-slate-900">
                          {prop.activeTenants ?? prop.currentResidents ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Financials BI Analytics */}
      {activeTab === "Financials" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Gross Collections</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {fin?.totalCollectedFormatted || "₹0"}
              </div>
              <span className="text-xs text-slate-500 font-medium">All collections this month</span>
            </div>
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Outstanding Dues</span>
              <div className="text-2xl font-bold text-rose-600 mt-1">
                {fin?.outstandingBalanceFormatted || "₹0"}
              </div>
              <span className="text-xs text-slate-500 font-medium">Overdue tenant balances</span>
            </div>
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Billed</span>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {fin?.totalBilledFormatted || "₹0"}
              </div>
              <span className="text-xs text-blue-600 font-medium">Total rent & utility dues</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Occupancy */}
      {activeTab === "Occupancy" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-center">
            <h3 className="text-base font-bold text-slate-900 mb-4 self-start">
              Bed Occupancy Distribution ({occupancyPercent}%)
            </h3>
            <div className="h-64 w-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={occupancyPieData}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {occupancyPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 mt-4 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span>{occupiedBeds} Occupied Beds</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-400" />
                <span>{vacantBeds} Vacant Beds</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tenancy Health</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Occupancy Rate</span>
                  <span>{occupancyPercent}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating "Ask Rio AI (BETA)" Pill matching ref-4 */}
      <div className="fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => toast.info("Rio AI Assistant is analyzing your portfolio metrics...")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/80 text-slate-800 font-semibold text-xs shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:scale-105 transition cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>Ask Rio AI</span>
          <span className="rounded-full bg-blue-100 text-blue-700 text-[9px] font-extrabold px-1.5 py-0.2 uppercase">
            Beta
          </span>
        </button>
      </div>
    </div>
  );
}
