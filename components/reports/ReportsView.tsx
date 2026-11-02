"use client";

import React from "react";
import { FileText, Download, TrendingUp, Users, DollarSign } from "lucide-react";
import { authStorage } from "@/lib/api/client";
import { toast } from "sonner";

export default function ReportsView() {
  const downloadReport = async (path: string, filename: string) => {
    try {
      const token = authStorage.getToken();
      const res = await fetch(`/api/v1/reports/${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to export report");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`${filename} downloaded successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to download CSV");
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial & Operational Reports</h1>
        <p className="text-xs text-slate-500 mt-1">
          Export verified ledger entries, collections, resident roll, and expense logs to CSV / Excel
        </p>
      </div>

      {/* CSV Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Collections CSV */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Collections Report</h3>
              <span className="text-xs text-slate-400">Payment receipt audit trail</span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Contains resident name, phone, room, payment mode (UPI/Cash), receipt numbers, and bank UTRs.
          </p>
          <button
            onClick={() => downloadReport("collections/csv", "collections_report.csv")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export Collections CSV</span>
          </button>
        </div>

        {/* Residents CSV */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Resident Registry</h3>
              <span className="text-xs text-slate-400">Tenant roll & stay records</span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Full resident list with room assignments, joining dates, monthly rents, deposit balances, and statuses.
          </p>
          <button
            onClick={() => downloadReport("residents/csv", "residents_registry.csv")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export Residents CSV</span>
          </button>
        </div>

        {/* Expenses CSV */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Expense Ledger</h3>
              <span className="text-xs text-slate-400">Operational costs & outflow</span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Categorized expense vouchers, payee/vendor details, disbursing staff, and payment modes.
          </p>
          <button
            onClick={() => downloadReport("expenses/csv", "expense_ledger.csv")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export Expenses CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
