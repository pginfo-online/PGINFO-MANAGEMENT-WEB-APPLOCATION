"use client";

import React from "react";
import { Building2, Globe, Star, MapPin, Eye, Share2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function ListingsView() {
  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marketplace & Public Listings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish your properties to Google search, student housing portals, and direct booking websites
          </p>
        </div>

        <button
          onClick={() => toast.info("Opening listing registration wizard...")}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Public Listing</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="h-48 w-full relative">
            <img
              src="https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80"
              alt="Vanalilka PG"
              className="h-full w-full object-cover"
            />
            <span className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
              Active Listing
            </span>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Vanalilka Luxury PG & Co-Living</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>Pirangut, Pune, Maharashtra 412115</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="bg-slate-100 px-2.5 py-1 rounded-xl">WiFi 200 Mbps</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-xl">Attached Washrooms</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-xl">Food & Mess</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-xl">Power Backup</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-900 text-sm">Starting ₹8,000 /bed</span>
              <div className="flex gap-2">
                <button
                  onClick={() => toast.success("Public booking link copied!")}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
                >
                  Share Link
                </button>
                <button
                  onClick={() => window.open("https://ezpg.me?id=4121157706A", "_blank")}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-xs"
                >
                  View Public Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
