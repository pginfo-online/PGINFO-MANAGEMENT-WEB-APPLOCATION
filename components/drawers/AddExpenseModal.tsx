"use client";

import React, { useState } from "react";
import { X, FileText, Loader2 } from "lucide-react";
import { useUiStore, usePropertyStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function AddExpenseModal() {
  const { isAddExpenseOpen, setAddExpenseOpen } = useUiStore();
  const { selectedPropertyId } = usePropertyStore();
  const queryClient = useQueryClient();

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [paidTo, setPaidTo] = useState("");
  const [paidBy, setPaidBy] = useState("Owner");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const { data: categories } = useQuery({
    queryKey: ["expenseCategories"],
    queryFn: () => api.expenses.listCategories(),
    enabled: isAddExpenseOpen,
  });

  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => api.properties.list(),
    enabled: isAddExpenseOpen,
  });

  const properties = propertiesData?.data || [];
  const propertyId = selectedPropertyId || (properties[0]?.id ?? "");

  const addExpenseMutation = useMutation({
    mutationFn: async () => {
      const amountPaise = Math.round(parseFloat(amount) * 100);
      return api.expenses.create({
        propertyId,
        categoryId: categoryId || (categories?.[0]?.id ?? ""),
        amount: amountPaise,
        paymentMode,
        paidTo,
        paidBy,
        description,
        expenseDate,
      });
    },
    onSuccess: () => {
      toast.success("Expense recorded successfully!");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to record expense");
    },
  });

  const closeModal = () => {
    setAddExpenseOpen(false);
    setAmount("");
    setDescription("");
    setPaidTo("");
  };

  if (!isAddExpenseOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter an expense description");
      return;
    }
    addExpenseMutation.mutate();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Record Expense Voucher</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expense Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white"
              >
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2500"
                required
                min="1"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white"
              >
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paid On (Date)
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paid To (Vendor/Person)
              </label>
              <input
                type="text"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                placeholder="e.g. Local Grocery Store"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paid By (Disbursed by)
              </label>
              <input
                type="text"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                placeholder="e.g. Owner / Warden"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Cleaning chemicals and soaps for Ground floor"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addExpenseMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-md shadow-rose-500/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {addExpenseMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span>Record Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
