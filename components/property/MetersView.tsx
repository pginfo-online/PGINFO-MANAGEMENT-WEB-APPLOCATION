"use client";

import React, { useState } from "react";
import {
  Gauge,
  Plus,
  Zap,
  Calculator,
  CheckCircle2,
  Calendar,
  Loader2,
} from "lucide-react";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatINR, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import { QueryError, Skeleton } from "../layout/WorkspaceUI";

export default function MetersView() {
  const { selectedPropertyId } = usePropertyStore();
  const queryClient = useQueryClient();
  const [isAddReadingOpen, setIsAddReadingOpen] = useState(false);
  const [selectedMeterId, setSelectedMeterId] = useState("");
  const [newReading, setNewReading] = useState("");

  const meterQuery = useQuery({
    queryKey: ["meters", selectedPropertyId],
    queryFn: () => api.meters.list(selectedPropertyId ?? undefined),
  });
  const meters = meterQuery.data ?? [];
  const reading = useMutation({
    mutationFn: () => api.meters.addReading(selectedMeterId, { reading: Number(newReading) }),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["meters"] });
      void queryClient.invalidateQueries({ queryKey: ["billing"] });
      void queryClient.invalidateQueries({ queryKey: ["money"] });
      toast.success("Meter reading recorded");
      setIsAddReadingOpen(false);
      setNewReading("");
    },
    onError(error) { toast.error(error.message); },
  });

  const handleAddReading = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reading.isPending && selectedMeterId && Number(newReading) > 0) reading.mutate();
  };

  if (meterQuery.isPending) return <Skeleton layout="cards" />;
  if (meterQuery.error) return <QueryError error={meterQuery.error} retry={() => void meterQuery.refetch()} />;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Electric Sub-Meters</h1>
          <p className="text-xs text-slate-500 mt-1">
            Sub-meter tracking, kWh consumption calculation, and automatic tenant bill splitting
          </p>
        </div>

        <button
          disabled={!meters.length}
          onClick={() => { setSelectedMeterId(meters[0]?.id ?? ""); setIsAddReadingOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Record Meter Reading</span>
        </button>
      </div>

      {!meters.length && <p className="workspace-card p-6 text-sm text-slate-600">No meters are configured for this view.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {meters.map((meter: any) => {
          const tariff = meter.tariffRate ? meter.tariffRate / 100 : 12;
          const consumed = Number(meter.currentReading) - Number(meter.initialReading);
          const totalBill = consumed * tariff;

          return (
            <div
              key={meter.id}
              className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Meter {meter.meterNumber}
                    </h3>
                    <span className="text-xs text-slate-400">
                      Room {meter.room?.roomNumber || "101"} · Tariff: ₹{tariff}/kWh
                    </span>
                  </div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Active
                </span>
              </div>

              {/* Readings Box */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs">
                <div>
                  <span className="text-slate-400 block">Initial (kWh)</span>
                  <span className="font-bold text-slate-800 text-sm">{meter.initialReading}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Current (kWh)</span>
                  <span className="font-bold text-slate-800 text-sm">{meter.currentReading}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Consumed</span>
                  <span className="font-bold text-blue-600 text-sm">{consumed} units</span>
                </div>
              </div>

              {/* Bill & Tenant Split */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block">Estimated cost since initial reading</span>
                  <span className="text-sm font-bold text-rose-600">₹{totalBill.toLocaleString("en-IN")}</span>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Record Reading Modal */}
      {isAddReadingOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsAddReadingOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Record New Meter Reading</h3>
              <button onClick={() => setIsAddReadingOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleAddReading} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Meter
                </label>
                <select className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white font-medium">
                  <option value="meter-1">MTR-101-A (Room 101)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Reading (kWh)
                </label>
                <input
                  type="number"
                  value={newReading}
                  onChange={(e) => setNewReading(e.target.value)}
                  required
                  min="1680"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddReadingOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Save Reading & Split
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
