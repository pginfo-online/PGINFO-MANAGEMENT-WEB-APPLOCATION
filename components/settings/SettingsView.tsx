"use client";

import React, { useState } from "react";
import { Settings, Shield, Building, FileText, Bell, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsView() {
  const [orgName, setOrgName] = useState("RentOk Living");
  const [rentDueDay, setRentDueDay] = useState(1);
  const [gracePeriodDays, setGracePeriodDays] = useState(5);
  const [lateFeeAmount, setLateFeeAmount] = useState(500);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Organization settings & billing rules saved!");
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization & Billing Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure default rental cycle rules, grace periods, automated late penalties, and branding
        </p>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">General Information</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Organization Legal Brand Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Recurring Billing & Grace Rules</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Rent Due Day
              </label>
              <input
                type="number"
                value={rentDueDay}
                onChange={(e) => setRentDueDay(Number(e.target.value))}
                min="1"
                max="28"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Grace Period (Days)
              </label>
              <input
                type="number"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                min="0"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Late Fee Penalty (₹)
              </label>
              <input
                type="number"
                value={lateFeeAmount}
                onChange={(e) => setLateFeeAmount(Number(e.target.value))}
                min="0"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold text-rose-600"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
