"use client";

import React, { useState } from "react";
import { X, Send, Megaphone, Loader2 } from "lucide-react";
import { useUiStore, usePropertyStore } from "@/lib/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function AnnouncementsModal() {
  const { isAnnouncementsOpen, setAnnouncementsOpen } = useUiStore();
  const { selectedPropertyId } = usePropertyStore();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("Water supply maintenance notice");
  const [body, setBody] = useState(
    "Please note: overhead water tank cleaning will take place tomorrow between 10 AM and 1 PM. Water supply will be interrupted."
  );
  const [scope, setScope] = useState<"PROPERTY" | "ORGANIZATION">("PROPERTY");

  const sendAnnouncementMutation = useMutation({
    mutationFn: async () => {
      const draft = await api.announcements.create({
        title,
        body,
        scope,
        propertyId: scope === "PROPERTY" ? selectedPropertyId || undefined : undefined,
      });
      return api.announcements.send(draft.id);
    },
    onSuccess: () => {
      toast.success("Announcement broadcast sent to residents!");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send announcement");
    },
  });

  const closeModal = () => {
    setAnnouncementsOpen(false);
  };

  if (!isAnnouncementsOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Please enter both title and body");
      return;
    }
    sendAnnouncementMutation.mutate();
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
            <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Megaphone className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Broadcast Announcement</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Broadcast Scope
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScope("PROPERTY")}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                  scope === "PROPERTY"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                Current Property Only
              </button>
              <button
                type="button"
                onClick={() => setScope("ORGANIZATION")}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                  scope === "ORGANIZATION"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                All Organization Properties
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title / Subject
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Electricity Maintenance Notice"
              required
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Announcement Message
            </label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here..."
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
              disabled={sendAnnouncementMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {sendAnnouncementMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Send Broadcast</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
