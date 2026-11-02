"use client";

import React, { useState } from "react";
import { MessageSquare, Send, CheckCircle2, QrCode, Phone, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function WhatsAppView() {
  const [template, setTemplate] = useState("RENT_DUE_REMINDER");
  const [previewName, setPreviewName] = useState("raghav");
  const [previewAmount, setPreviewAmount] = useState("₹32,516");

  const sendReminderMutation = useMutation({
    mutationFn: () =>
      api.announcements.sendRentReminders({
        channel: "WHATSAPP",
      }),
    onSuccess: () => {
      toast.success("Automated WhatsApp reminders dispatched to all overdue tenants!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to dispatch reminders");
    },
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">WhatsApp Communications & Due Reminders</h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated WhatsApp payment links, dynamic UPI pay requests, and rent receipts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration & Dispatch */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Configure WhatsApp Campaign</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select WhatsApp HSM Template
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white font-medium"
              >
                <option value="RENT_DUE_REMINDER">Official Rent Due Reminder (with UPI Deep Link)</option>
                <option value="RECEIPT_NOTIFICATION">Payment Received & Digital Receipt Link</option>
                <option value="MAINTENANCE_UPDATE">Complaint Resolution Status Update</option>
              </select>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                <span>Verified WhatsApp Business Account Active</span>
              </div>
              <p className="text-emerald-700 leading-relaxed">
                Messages will be delivered from your verified business phone number with official green badge checkmark.
              </p>
            </div>

            <button
              onClick={() => sendReminderMutation.mutate()}
              disabled={sendReminderMutation.isPending}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Dispatch Automated Rent Reminders Now</span>
            </button>
          </div>
        </div>

        {/* Right: Real-time Message Bubble Preview */}
        <div className="lg:col-span-5">
          <div className="p-6 rounded-3xl bg-[#ECE5DD] border border-slate-200/80 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              WhatsApp Message Preview
            </span>

            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2 text-xs text-slate-800 border-l-4 border-emerald-500">
              <p className="font-bold text-slate-900">
                Dear {previewName},
              </p>
              <p>
                This is a friendly reminder from <span className="font-semibold">Vanalilka PG</span> that your monthly rent and utility dues totaling <span className="font-bold text-rose-600">{previewAmount}</span> are currently due.
              </p>
              <p>
                Click below to pay instantly via UPI (GPay, PhonePe, Paytm):
              </p>
              <div className="pt-2">
                <span className="block text-center py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer">
                  👉 Pay {previewAmount} via UPI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 text-right mt-1">
                10:30 AM · Delivered ✓✓
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
