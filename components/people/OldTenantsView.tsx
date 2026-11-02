"use client";

import React, { useState } from "react";
import {
  UserCheck,
  CheckCircle2,
  FileText,
  Download,
  AlertCircle,
  Receipt,
  Search,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function OldTenantsView() {
  const [search, setSearch] = useState("");

  const formerTenants = [
    {
      id: "old-1",
      name: "Prateek Deshpande",
      mobile: "9823456789",
      room: "102 BedB",
      joiningDate: "2025-06-01",
      moveOutDate: "2026-09-30",
      securityDeposit: 2000000, // ₹20,000
      deductions: 350000, // ₹3,500 (Electricity + Damage)
      netRefund: 1650000, // ₹16,500
      clearanceStatus: "SETTLED",
    },
    {
      id: "old-2",
      name: "Karan Mehta",
      mobile: "9765432100",
      room: "201 BedA",
      joiningDate: "2025-08-15",
      moveOutDate: "2026-08-31",
      securityDeposit: 1800000, // ₹18,000
      deductions: 1800000,
      netRefund: 0,
      clearanceStatus: "SETTLED",
    },
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Former Tenants & Exit Clearance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical settlement archive, deposit reconciliation formulas, and exit certificates
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">FORMER RESIDENT</th>
                <th className="py-3.5 px-6">ROOM</th>
                <th className="py-3.5 px-6">TENANCY PERIOD</th>
                <th className="py-3.5 px-6">DEPOSIT HELD</th>
                <th className="py-3.5 px-6">DEDUCTIONS</th>
                <th className="py-3.5 px-6">NET REFUND</th>
                <th className="py-3.5 px-6 text-right">CLEARANCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {formerTenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900 block">{t.name}</span>
                    <span className="text-xs text-slate-400">{t.mobile}</span>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-700 font-medium">
                    {t.room}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600">
                    {formatDate(t.joiningDate)} → {formatDate(t.moveOutDate)}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900">
                    {formatINR(t.securityDeposit)}
                  </td>
                  <td className="py-4 px-6 text-xs text-rose-600 font-semibold">
                    -{formatINR(t.deductions)}
                  </td>
                  <td className="py-4 px-6 font-bold text-emerald-600">
                    {formatINR(t.netRefund)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => toast.success("Downloading Exit Settlement Certificate PDF...")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                    >
                      <Download className="h-3 w-3" />
                      <span>Settlement PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
