"use client";

import React, { useState } from "react";
import {
  PackageCheck,
  Search,
  Plus,
  GripVertical,
  CheckCircle2,
} from "lucide-react";
import { useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DueCategoryItem {
  id: string;
  name: string;
  active: boolean;
  type: "Variable Amount" | "Fixed Amount";
  defaultAmount?: number;
  icon: string;
}

export default function DuesPackageGrid() {
  const { setAddRentDuesOpen } = useUiStore();
  const [search, setSearch] = useState("");

  const [categories, setCategories] = useState<DueCategoryItem[]>([
    { id: "1", name: "Rent", active: true, type: "Variable Amount", icon: "🏠" },
    { id: "2", name: "Security Deposit", active: true, type: "Variable Amount", icon: "🐷" },
    { id: "3", name: "Joining Fee", active: true, type: "Variable Amount", icon: "💬" },
    { id: "4", name: "Police Verification", active: true, type: "Variable Amount", icon: "💬" },
    { id: "5", name: "Electricity Charge", active: true, type: "Variable Amount", icon: "⚡" },
    { id: "6", name: "Food & Mess", active: true, type: "Variable Amount", icon: "🍲" },
    { id: "7", name: "Maintenance Charge", active: true, type: "Fixed Amount", defaultAmount: 1000, icon: "🧹" },
    { id: "8", name: "WiFi & High Speed Internet", active: true, type: "Fixed Amount", defaultAmount: 500, icon: "📶" },
    { id: "9", name: "Late Fee Penalty", active: true, type: "Fixed Amount", defaultAmount: 500, icon: "⏱" },
    { id: "10", name: "Laundry Facility", active: true, type: "Variable Amount", icon: "🧺" },
    { id: "11", name: "Water Tanker Charge", active: true, type: "Variable Amount", icon: "🚰" },
    { id: "12", name: "Locker Key Deposit", active: false, type: "Fixed Amount", defaultAmount: 200, icon: "🔑" },
    { id: "13", name: "Air Conditioner Surcharge", active: false, type: "Variable Amount", icon: "❄️" },
    { id: "14", name: "Guest Stay Fee", active: false, type: "Fixed Amount", defaultAmount: 500, icon: "👥" },
    { id: "15", name: "Gym Membership", active: false, type: "Fixed Amount", defaultAmount: 800, icon: "🏋️" },
    { id: "16", name: "Deep Cleaning Fee", active: false, type: "Fixed Amount", defaultAmount: 600, icon: "🧼" },
    { id: "17", name: "Move-in Inspection Charge", active: false, type: "Fixed Amount", defaultAmount: 300, icon: "📋" },
    { id: "18", name: "Parking Pass (2-Wheeler)", active: false, type: "Fixed Amount", defaultAmount: 300, icon: "🛵" },
    { id: "19", name: "Parking Pass (4-Wheeler)", active: false, type: "Fixed Amount", defaultAmount: 1500, icon: "🚗" },
    { id: "20", name: "Pest Control Assessment", active: false, type: "Variable Amount", icon: "🐜" },
    { id: "21", name: "Generator Fuel Surcharge", active: false, type: "Variable Amount", icon: "⛽" },
    { id: "22", name: "Miscellaneous Incidentals", active: false, type: "Variable Amount", icon: "📌" },
  ]);

  const toggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
    toast.success("Billing package category updated");
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = categories.filter((c) => c.active).length;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Title & Counters matching ref-6 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dues Package</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage due categories and billing settings
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <span className="text-slate-400 text-xs font-semibold block">Total Categories</span>
            <span className="text-2xl font-bold text-slate-900">{categories.length}</span>
          </div>
          <div className="border-l border-slate-200 pl-6">
            <span className="text-slate-400 text-xs font-semibold block">Active Categories</span>
            <span className="text-2xl font-bold text-blue-600">{activeCount}</span>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search due categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl bg-white border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
        />
      </div>

      {/* Categories Cards Grid matching ref-6 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((cat) => (
          <div
            key={cat.id}
            className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg">
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.2 rounded uppercase",
                        cat.active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {cat.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                </div>

                {/* Toggle & Drag Handle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      "w-10 h-5 flex items-center rounded-full p-0.5 transition cursor-pointer",
                      cat.active ? "bg-blue-600 justify-end" : "bg-slate-300 justify-start"
                    )}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                  <GripVertical className="h-4 w-4 text-slate-300 cursor-grab" />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-xs text-slate-400 font-medium">{cat.type}</span>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100">
              <button
                onClick={() => setAddRentDuesOpen(true)}
                className="w-full py-2 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                Add Dues
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
