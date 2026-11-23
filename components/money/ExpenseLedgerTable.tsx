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
import { ExpenseEditor, type ExpenseRecord } from "../drawers/AddExpenseModal";
import { QueryError, Skeleton } from "../layout/WorkspaceUI";

export default function ExpenseLedgerTable() {
  const { selectedPropertyId } = usePropertyStore();
  const { setAddExpenseOpen } = useUiStore();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<ExpenseRecord>();
  const [pagination, setPagination] = useState({ propertyId: selectedPropertyId, page: 1 });
  const page = pagination.propertyId === selectedPropertyId ? pagination.page : 1;
  const { data: expensesData, isLoading, error, refetch } = useQuery({
    queryKey: ["expenses", selectedPropertyId, page],
    queryFn: () => api.expenses.list({ propertyId: selectedPropertyId ?? undefined, page, limit: 25 }),
  });

  const expenses = expensesData?.data || [];

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => api.expenses.delete(id),
    onSuccess: () => {
      toast.success("Expense voucher removed");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["money"] });
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

      {error && <QueryError error={error} retry={() => void refetch()} />}
      {expensesData && <div className="workspace-card p-4 text-sm text-slate-600">
        <strong className="text-slate-900">{formatINR(totalExpense)}</strong> on this page · {expensesData.meta.total} expenses
      </div>}

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
                    <Skeleton count={4} />
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
                      {e.paidBy || "—"}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700">
                      {e.paidTo || "—"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="workspace-button mr-2" onClick={() => setEditing(e)}>Edit</button>
                      <button aria-label="Delete expense" disabled={deleteExpenseMutation.isPending}
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
      {(page > 1 || expensesData?.meta.hasMore) && <div className="flex justify-end gap-2">
        <button className="workspace-button" disabled={page === 1} onClick={() => setPagination({ propertyId: selectedPropertyId, page: page - 1 })}>Previous</button>
        <button className="workspace-button" disabled={!expensesData?.meta.hasMore} onClick={() => setPagination({ propertyId: selectedPropertyId, page: page + 1 })}>Next</button>
      </div>}
      {editing && <ExpenseEditor expense={editing} close={() => setEditing(undefined)} />}
    </div>
  );
}
