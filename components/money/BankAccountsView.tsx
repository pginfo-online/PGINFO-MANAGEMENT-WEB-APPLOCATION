"use client";

import React, { useState } from "react";
import {
  Building2,
  Plus,
  CreditCard,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Building,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function BankAccountsView() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [payeeName, setPayeeName] = useState("Asha Sharma");
  const [mobile, setMobile] = useState("9876543210");
  const [accountNumber, setAccountNumber] = useState("98765432101234");
  const [ifsc, setIfsc] = useState("HDFC0001234");
  const [bankName, setBankName] = useState("HDFC Bank");
  const [pan, setPan] = useState("ABCDE1234F");
  const [accountType, setAccountType] = useState("CURRENT");
  const [upiId, setUpiId] = useState("ashasharma@okhdfcbank");

  const [connectedAccounts, setConnectedAccounts] = useState([
    {
      id: "acc-1",
      payeeName: "RentOk Living Collections",
      bankName: "HDFC Bank Ltd",
      accountNumber: "••••••••••••1234",
      ifsc: "HDFC0001234",
      accountType: "Current Account",
      upiId: "rentokliving@hdfcbank",
      isPrimary: true,
      linkedProperties: ["Vanalilka", "tst2"],
    },
  ]);

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const newAcc = {
      id: `acc-${Date.now()}`,
      payeeName,
      bankName,
      accountNumber: `••••••••${accountNumber.slice(-4)}`,
      ifsc,
      accountType: accountType === "CURRENT" ? "Current Account" : "Savings Account",
      upiId,
      isPrimary: false,
      linkedProperties: ["Vanalilka"],
    };
    setConnectedAccounts((prev) => [...prev, newAcc]);
    toast.success("Bank account added & linked to property!");
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bank Overview & UPI</h1>
          <p className="text-xs text-slate-500 mt-1">
            Connected payout accounts, UPI QR collection, and property settlement accounts
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Bank Account</span>
        </button>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {connectedAccounts.map((acc) => (
          <div
            key={acc.id}
            className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{acc.payeeName}</h3>
                    {acc.isPrimary && (
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">{acc.bankName} · {acc.accountType}</span>
                </div>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Account Number:</span>
                <span className="font-mono font-bold text-slate-900">{acc.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IFSC Code:</span>
                <span className="font-mono font-semibold text-slate-900">{acc.ifsc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verified UPI ID:</span>
                <span className="font-mono font-semibold text-blue-600">{acc.upiId}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-slate-500">
                Linked Properties: <span className="font-bold text-slate-700">{acc.linkedProperties.join(", ")}</span>
              </span>
              <button
                onClick={() => toast.info("Property linkage updated")}
                className="text-blue-600 font-semibold hover:underline"
              >
                Link Property
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Bank Modal */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsAddOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add Bank Account & UPI</h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Beneficiary / Payee Name
                  </label>
                  <input
                    type="text"
                    value={payeeName}
                    onChange={(e) => setPayeeName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm uppercase font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white"
                  >
                    <option value="CURRENT">Current Account</option>
                    <option value="SAVINGS">Savings Account</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PAN Card Number
                  </label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    placeholder="ABCDE1234F"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UPI ID / VPA
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="name@upi"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition"
                >
                  Save & Link Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
