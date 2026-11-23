"use client";

import { Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { usePropertyStore } from "@/lib/store";
import { PageHeading } from "../layout/WorkspaceUI";

export default function WhatsAppView() {
  const { selectedPropertyId, activePropertyName } = usePropertyStore();
  const reminders = useMutation({
    mutationFn: () => api.announcements.sendRentReminders({ propertyId: selectedPropertyId ?? undefined, channel: "WHATSAPP" }),
  });
  return (
    <>
      <PageHeading title="WhatsApp" description="Send rent reminders to eligible tenants using the configured WhatsApp provider." />
      <section className="workspace-card max-w-xl space-y-4 p-5">
        <h2 className="font-semibold">Rent reminders</h2>
        <p className="text-sm text-slate-600">Scope: {activePropertyName}</p>
        <button className="workspace-button primary" disabled={reminders.isPending} onClick={() => {
          if (confirm(`Send rent reminders for ${activePropertyName}?`)) reminders.mutate();
        }}><Send className="size-4" />{reminders.isPending ? "Sending…" : "Send reminders"}</button>
        {reminders.error && <p className="text-sm text-rose-700" role="alert">{reminders.error.message}</p>}
        {reminders.data && <p className="text-sm text-slate-700" role="status">{reminders.data.remindersSent} accepted · {reminders.data.failedCount} failed</p>}
      </section>
    </>
  );
}
