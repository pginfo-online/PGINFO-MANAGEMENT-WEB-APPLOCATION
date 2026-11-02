"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Building2,
  Search,
  Check,
  Plus,
  ChevronDown,
  X,
} from "lucide-react";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export default function PropertySelectorModal() {
  const {
    selectedPropertyId,
    setSelectedPropertyId,
  } = usePropertyStore();
  const {
    isPropertySelectorOpen,
    setPropertySelectorOpen,
    setAddPropertyOpen,
  } = useUiStore();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"Property" | "Area" | "Groups">(
    "Property"
  );
  const dialogRef = useRef<HTMLDivElement>(null);

  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => api.properties.list(),
  });

  const { data: metrics } = useQuery({
    queryKey: ["dashboardMetrics"],
    queryFn: () => api.dashboard.getMetrics(),
  });

  const properties = propertiesData?.data || [];
  const totalBeds = metrics?.operational?.totalBeds ?? 0;
  const totalTenants = metrics?.operational?.currentResidents ?? 0;

  useEffect(() => {
    if (!isPropertySelectorOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPropertySelectorOpen(false);
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialogRef.current?.focus();
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPropertySelectorOpen, setPropertySelectorOpen]);

  if (!isPropertySelectorOpen) return null;

  const filteredProperties = properties.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.city && p.city.toLowerCase().includes(search.toLowerCase())) ||
    (p.addressLine1 && p.addressLine1.toLowerCase().includes(search.toLowerCase()))
  );

  // Group properties by area / city
  const grouped: Record<string, typeof filteredProperties> = {};
  filteredProperties.forEach((p) => {
    const groupName = p.city || "Other";
    if (!grouped[groupName]) grouped[groupName] = [];
    grouped[groupName].push(p);
  });

  const handleSelectProperty = (id: string, name: string) => {
    setSelectedPropertyId(id, name);
    setPropertySelectorOpen(false);
  };

  const handleSelectAll = () => {
    setSelectedPropertyId(null, "All Properties");
  };

  return (
    <>
      <div
        className="property-selector-backdrop fixed inset-0 z-[60] animate-in fade-in duration-150"
        onClick={() => setPropertySelectorOpen(false)}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        id="property-selector-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="property-selector-title"
        tabIndex={-1}
        className="property-selector-panel fixed z-[61] flex flex-col overflow-hidden text-slate-800 shadow-2xl"
      >
        {/* Header Search */}
        <div className="shrink-0 px-5 pt-4">
          <h2 id="property-selector-title" className="sr-only">
            Select a property
          </h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Properties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-11 pr-11 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search properties"
            />
            <button
              type="button"
              onClick={() => setPropertySelectorOpen(false)}
              aria-label="Close property selector"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Selector Tabs: Property, Area, Groups */}
          <div className="mt-2 flex items-center justify-around border-b border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab("Property")}
              className={cn(
                "flex min-w-20 flex-col items-center border-b-[3px] px-3 pb-3 pt-1 text-sm font-semibold transition cursor-pointer",
                activeTab === "Property"
                  ? "border-[#354fff] text-[#12266f]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <span className="mb-1 text-2xl">🏢</span>
              <span>Property</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("Area")}
              className={cn(
                "flex min-w-20 flex-col items-center border-b-[3px] px-3 pb-3 pt-1 text-sm font-semibold transition cursor-pointer",
                activeTab === "Area"
                  ? "border-[#354fff] text-[#12266f]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <span className="mb-1 text-2xl">📍</span>
              <span>Area</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("Groups")}
              className={cn(
                "flex min-w-20 flex-col items-center border-b-[3px] px-3 pb-3 pt-1 text-sm font-semibold transition cursor-pointer",
                activeTab === "Groups"
                  ? "border-[#354fff] text-[#12266f]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <span className="mb-1 text-2xl">🏘️</span>
              <span>Groups</span>
            </button>
          </div>
        </div>

        {/* Dynamic Counter Summary Strip */}
        <div className="mx-5 mt-3 flex shrink-0 items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3 text-xs shadow-sm">
          <div className="flex min-w-0 items-center justify-around gap-2 text-center">
            <div className="min-w-10">
              <strong className="block text-base text-[#172b7a]">{properties.length}</strong>
              <span className="text-slate-500">Property</span>
            </div>
            <span className="h-6 border-l border-slate-200" aria-hidden="true" />
            <div className="min-w-10">
              <strong className="block text-base text-[#172b7a]">{totalBeds}</strong>
              <span className="text-slate-500">Beds</span>
            </div>
            <span className="h-6 border-l border-slate-200" aria-hidden="true" />
            <div className="min-w-12">
              <strong className="block text-base text-[#172b7a]">{totalTenants}</strong>
              <span className="text-slate-500">Tenants</span>
            </div>
          </div>
          <label className="flex shrink-0 items-center gap-1.5 cursor-pointer font-medium text-slate-600">
            <span className="hidden sm:inline">Select All</span>
            <input
              type="checkbox"
              checked={selectedPropertyId === null}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Property Groups List or Empty State */}
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {properties.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">No Properties Yet</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Add your first PG, hostel, or flat to begin managing rooms and tenants.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPropertySelectorOpen(false);
                  setAddPropertyOpen(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Add New Property</span>
              </button>
            </div>
          ) : (
            Object.entries(grouped).map(([area, props]) => (
              <div key={area} className="space-y-1.5">
                <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl text-amber-500">🏛️</span>
                    <span>{area}</span>
                    <span className="text-slate-400 font-normal text-xs">
                      {props.length} {props.length === 1 ? "Property" : "Properties"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#354fff]" />
                </div>

                {props.map((p) => {
                  const isSelected = selectedPropertyId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProperty(p.id, p.name)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border-2 p-4 transition cursor-pointer group",
                        isSelected
                          ? "border-white bg-white/90 shadow-sm"
                          : "border-white/80 bg-white/55 hover:border-white hover:bg-white/90"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-[#45369f] text-white font-bold flex items-center justify-center text-base shadow-sm shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {p.name}
                            </span>
                            {isSelected && (
                              <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                Selected
                              </span>
                            )}
                          </div>
                          <span className="line-clamp-1 text-xs text-slate-500">
                            {p.type} · {p.city || "India"}
                          </span>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "h-5 w-5 rounded-md flex items-center justify-center border transition shrink-0 ml-2",
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-slate-300 group-hover:border-slate-400"
                        )}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions with + New Property */}
        <div className="shrink-0 space-y-2 border-t border-indigo-100 bg-white/90 p-4">
          <button
            type="button"
            onClick={() => {
              setPropertySelectorOpen(false);
              setAddPropertyOpen(true);
            }}
            className="mx-auto flex w-fit min-w-48 items-center justify-center gap-2 rounded-full bg-[#354fff] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Add New Property</span>
          </button>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                handleSelectAll();
                setPropertySelectorOpen(false);
              }}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white transition cursor-pointer"
            >
              View All
            </button>
            <button
              type="button"
              onClick={() => setPropertySelectorOpen(false)}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-xs font-semibold text-white transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
