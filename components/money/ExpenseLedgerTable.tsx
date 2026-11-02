"use client";

import React, { useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  Filter,
  DollarSign,
  Loader2,
} from "lucide-react";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatINR, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ExpenseLedgerTable() {
  const { selectedPropertyId } = usePropertyStore();
  const { setAddExpenseOpen } = useUiStore();
  const queryClient = useQueryClient();

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ["expenses", selectedPropertyId],
    queryFn: () =>
      api.expenses.list({
        propertyId: selectedPropertyId || undefined,
        limit: 50,
      }),
  });

  const expenses = expensesData?.data || [];

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => api.expenses.delete(id),
    onSuccess: () => {
      toast.success("Expense voucher removed");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete expense");
    },
  });

  const totalExpense = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expense Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Cash outflow management tracking operational costs, utilities, and staff salaries
          </p>
        </div>

        <button
          onClick={() => setAddExpenseOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-500/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add an Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Total Expenses Incurred</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {formatINR(totalExpense)}
          </span>
          <span className="text-xs text-slate-500 font-medium">{expenses.length} operational vouchers</span>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Salaries & Payroll</span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">₹0</span>
          <span className="text-xs text-slate-500 font-medium">Pending cycle disbursement</span>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Repair & Maintenance</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">₹0</span>
          <span className="text-xs text-slate-500 font-medium">Plumbing & electrical</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">PAID ON</th>
                <th className="py-3.5 px-6">CATEGORY</th>
                <th className="py-3.5 px-6">AMOUNT</th>
                <th className="py-3.5 px-6">PAYMENT MODE</th>
                <th className="py-3.5 px-6">PAID BY</th>
                <th className="py-3.5 px-6">PAID TO</th>
                <th className="py-3.5 px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading expense ledger...</span>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No expense vouchers recorded yet. Click &quot;Add an Expense&quot; above to log one.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                      {formatDate(e.expenseDate)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        {e.category?.name || "Operational"}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {formatINR(e.amount)}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700">
                      {e.paymentMode}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700 font-medium">
                      {e.paidBy || "Owner"}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700">
                      {e.paidTo || "Vendor"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          if (confirm("Delete this expense voucher?")) {
                            deleteExpenseMutation.mutate(e.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
