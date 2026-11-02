"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  Building,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useUiStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";

export default function CollectPaymentDrawer() {
  const {
    isReceivePaymentOpen,
    setReceivePaymentOpen,
    selectedResidentForPayment,
    setSelectedResidentForPayment,
  } = useUiStore();
  const queryClient = useQueryClient();

  const [residentId, setResidentId] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"UPI" | "CASH" | "BANK_TRANSFER" | "CHEQUE">("UPI");
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const { data: residentsData } = useQuery({
    queryKey: ["residents"],
    queryFn: () => api.residents.list({ limit: 100 }),
    enabled: isReceivePaymentOpen,
  });

  const residents = residentsData?.data || [];

  useEffect(() => {
    if (selectedResidentForPayment) {
      setResidentId(selectedResidentForPayment.id);
      if (selectedResidentForPayment.pendingDues) {
        setAmount(String(selectedResidentForPayment.pendingDues / 100));
      } else if (selectedResidentForPayment.monthlyRent) {
        setAmount(String(selectedResidentForPayment.monthlyRent / 100));
      }
    } else if (residents.length > 0 && !residentId) {
      setResidentId(residents[0].id);
      if (residents[0].monthlyRent) {
        setAmount(String(residents[0].monthlyRent / 100));
      }
    }
  }, [selectedResidentForPayment, residents, residentId]);

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      const amountInPaise = Math.round(parseFloat(amount) * 100);
      return api.payments.record({
        residentId,
        amount: amountInPaise,
        mode,
        collectionDate,
        reference: reference || `REF-${Date.now()}`,
        notes: notes || "Rent payment received",
      });
    },
    onSuccess: (data) => {
      toast.success("Payment recorded successfully!");
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      queryClient.invalidateQueries({ queryKey: ["residents"] });
      closeDrawer();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to record payment");
    },
  });

  const closeDrawer = () => {
    setReceivePaymentOpen(false);
    setSelectedResidentForPayment(null);
    setReference("");
    setNotes("");
  };

  if (!isReceivePaymentOpen) return null;

  const currentResident = residents.find((r) => r.id === residentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentId) {
      toast.error("Please select a resident");
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    recordPaymentMutation.mutate();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={closeDrawer}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between text-slate-800 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Receive Payment</h2>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between p-5 overflow-y-auto">
          <div className="space-y-4">
            {/* Resident Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Tenant / Resident
              </label>
              <select
                value={residentId}
                onChange={(e) => setResidentId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.firstName} {r.lastName || ""} (Room {r.room?.roomNumber || "-"}, {r.mobile})
                  </option>
                ))}
              </select>
            </div>

            {currentResident && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block">Contract Monthly Rent</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatINR(currentResident.monthlyRent)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Security Deposit</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatINR(currentResident.securityDeposit)}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Received (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="24000"
                  required
                  min="1"
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-2.5 text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Payment Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "UPI", label: "UPI / QR", icon: QrCode },
                  { id: "CASH", label: "Cash", icon: Banknote },
                  { id: "BANK_TRANSFER", label: "Bank Transfer", icon: Building },
                  { id: "CHEQUE", label: "Cheque", icon: CreditCard },
                ].map((item) => {
                  const isSelected = mode === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id as any)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/50 text-emerald-800"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collection Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paid On (Date)
              </label>
              <input
                type="date"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Reference / UTR / Cheque #
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. UPI/20261101/987654321"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receipt Note
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Cleared November Rent"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={closeDrawer}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordPaymentMutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {recordPaymentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
