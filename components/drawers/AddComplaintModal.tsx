"use client";

import React, { useState } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { useUiStore, usePropertyStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function AddComplaintModal() {
  const { isAddComplaintOpen, setAddComplaintOpen } = useUiStore();
  const { selectedPropertyId } = usePropertyStore();
  const queryClient = useQueryClient();

  const [categoryId, setCategoryId] = useState("");
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [location, setLocation] = useState("Room 101");
  const [description, setDescription] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["complaintCategories"],
    queryFn: () => api.complaints.listCategories(),
    enabled: isAddComplaintOpen,
  });

  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => api.properties.list(),
    enabled: isAddComplaintOpen,
  });

  const properties = propertiesData?.data || [];
  const propertyId = selectedPropertyId || (properties[0]?.id ?? "");

  const addComplaintMutation = useMutation({
    mutationFn: async () => {
      return api.complaints.create({
        propertyId,
        categoryId: categoryId || (categories?.[0]?.id ?? ""),
        urgency,
        location,
        description,
      });
    },
    onSuccess: () => {
      toast.success("Helpdesk ticket logged successfully!");
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log complaint");
    },
  });

  const closeModal = () => {
    setAddComplaintOpen(false);
    setDescription("");
  };

  if (!isAddComplaintOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 5) {
      toast.error("Please provide at least 5 characters in description");
      return;
    }
    addComplaintMutation.mutate();
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
            <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertCircle className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Register Maintenance Ticket</h2>
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
                Category
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
                Priority / Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white font-medium"
              >
                <option value="LOW">Low (SLA &lt; 5 days)</option>
                <option value="MEDIUM">Medium (SLA &lt; 48 hrs)</option>
                <option value="HIGH">High (SLA &lt; 24 hrs)</option>
                <option value="CRITICAL">Critical (SLA &lt; 6 hrs)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Location / Room #
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Room 101 or 2nd Floor Corridor"
              required
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Problem Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              required
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
              disabled={addComplaintMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-md shadow-amber-500/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {addComplaintMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span>Log Ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
