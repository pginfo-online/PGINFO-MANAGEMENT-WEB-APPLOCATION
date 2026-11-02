"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Plus,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatINR, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function LeadsView() {
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => api.leads.list(),
  });

  const leads = leadsData || [
    {
      id: "l-1",
      name: "Ankit Sharma",
      mobile: "9123456780",
      email: "ankit.s@gmail.com",
      status: "VISITED",
      sharingPreference: "DOUBLE",
      budget: 1200000,
      notes: "Requested Ground floor room if available.",
    },
    {
      id: "l-2",
      name: "Sneha Patel",
      mobile: "9811223344",
      email: "sneha.p@gmail.com",
      status: "NEW",
      sharingPreference: "SINGLE",
      budget: 1600000,
      notes: "Looking for AC room from December 1st.",
    },
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CRM Lead Pipeline</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track prospective tenants from initial inquiry to scheduled tours and booking
          </p>
        </div>

        <button
          onClick={() => toast.info("Opening quick lead capture modal...")}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Lead</span>
        </button>
      </div>

      {/* Kanban / Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stage 1: New Inquiries */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
            <span className="text-xs font-bold text-blue-800 uppercase">New Inquiries</span>
            <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Sneha Patel</h4>
                <span className="text-xs text-slate-400">9811223344</span>
              </div>
              <span className="text-xs font-bold text-blue-600">₹16,000 budget</span>
            </div>
            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              Looking for AC room from December 1st.
            </p>
            <div className="flex justify-between items-center pt-2 text-xs border-t border-slate-100">
              <span className="text-slate-400">Single Suite</span>
              <button
                onClick={() => toast.success("Tour scheduled!")}
                className="text-blue-600 font-semibold hover:underline"
              >
                Schedule Tour →
              </button>
            </div>
          </div>
        </div>

        {/* Stage 2: Tour Scheduled & Visited */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
            <span className="text-xs font-bold text-amber-800 uppercase">Visited & Touring</span>
            <span className="h-5 w-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Ankit Sharma</h4>
                <span className="text-xs text-slate-400">9123456780</span>
              </div>
              <span className="text-xs font-bold text-emerald-600">₹12,000 budget</span>
            </div>
            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              Visited Room 101 on Sunday. Requested Ground floor room.
            </p>
            <div className="flex justify-between items-center pt-2 text-xs border-t border-slate-100">
              <span className="text-slate-400">Double Sharing</span>
              <button
                onClick={() => toast.success("Advance token collected!")}
                className="text-emerald-600 font-semibold hover:underline"
              >
                Take Token →
              </button>
            </div>
          </div>
        </div>

        {/* Stage 3: Ready for Move-In */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-xs font-bold text-emerald-800 uppercase">Ready for Admission</span>
            <span className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              0
            </span>
          </div>

          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl">
            <span className="text-xs">Drag and drop qualified leads here</span>
          </div>
        </div>
      </div>
    </div>
  );
}
