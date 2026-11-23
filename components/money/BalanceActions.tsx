"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";
import { api, authStorage } from "@/lib/api/client";
import { formatINR } from "@/lib/utils";
import { QueryError, Skeleton } from "../layout/WorkspaceUI";

const tabs = ["Reminder", "Discount", "Remark"] as const;
type Tab = (typeof tabs)[number];

function contactUrl(phone: string | undefined, message: string) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (/^[6-9]\d{9}$/.test(digits)) return `https://wa.me/91${digits}?text=${encodeURIComponent(message)}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  return undefined;
}

export default function BalanceActions({ id, close }: { id: string; close: () => void }) {
  const [tab, setTab] = useState<Tab>("Reminder");
  const [minimum, setMinimum] = useState<"FULL" | "CUSTOM">("FULL");
  const client = useQueryClient();
  const canDiscount = ["OWNER", "ADMIN", "MANAGER"].includes(authStorage.getUser()?.activeOrganizationRole ?? "");
  const reminder = useQuery({
    queryKey: ["money", "reminder", id],
    queryFn: ({ signal }) => api.money.reminder(id, signal),
  });
  const link = useMutation({
    mutationFn: () => api.money.createPaymentLink(id),
    onSuccess() { void reminder.refetch(); },
  });
  const save = useMutation({
    mutationFn: (form: FormData) => {
      const description = String(form.get("description")).trim();
      if (tab === "Remark") return api.money.saveRemark(id, description);
      return api.money.offerDiscount(id, {
        amount: Math.round(Number(form.get("amount")) * 100),
        validTill: String(form.get("validTill")),
        minimumPayment: minimum,
        minimumAmount: minimum === "CUSTOM" ? Math.round(Number(form.get("minimumAmount")) * 100) : undefined,
        description,
      });
    },
    onSuccess() {
      for (const key of ["billing", "money", "resident", "dashboardMetrics"]) void client.invalidateQueries({ queryKey: [key] });
      toast.success(tab === "Remark" ? "Remark saved" : "Discount saved");
      close();
    },
  });
  const data = reminder.data;
  const pending = link.isPending || save.isPending;
  const mobile = data?.resident.whatsappNumber || data?.resident.mobile;
  const tenantUrl = data ? contactUrl(mobile, data.message) : undefined;
  const parentUrl = data ? contactUrl(data.resident.parentPhone, `Hello ${data.resident.parentName ?? "there"}, ${data.resident.firstName} has an outstanding balance of ${formatINR(data.totalDues)}. ${data.paymentLink ? `Payment link: ${data.paymentLink}` : "Please contact the property manager for payment details."}`) : undefined;

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !pending) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="workspace-overlay" />
        <Dialog.Content className="workspace-dialog">
          <div className="flex justify-between gap-3"><div><Dialog.Title className="text-xl font-semibold">Tenant balance</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-600">{data ? `${data.resident.firstName} · ${formatINR(data.totalDues)} outstanding` : "Manage reminders and payment options."}</Dialog.Description></div><Dialog.Close className="workspace-icon" aria-label="Close balance actions" disabled={pending}><X className="size-5" /></Dialog.Close></div>
          <div className="workspace-tabs my-4">{tabs.filter((item) => item !== "Discount" || canDiscount).map((item) => <button key={item} className="workspace-button" aria-pressed={tab === item} disabled={pending} onClick={() => { save.reset(); setTab(item); }}>{item}</button>)}</div>
          {tab === "Reminder" && <>
            {reminder.isPending && <Skeleton count={2} />}
            {reminder.error && <QueryError error={reminder.error} retry={() => void reminder.refetch()} />}
            {data && <>
              <p className="break-words rounded-lg bg-emerald-50 p-4 text-sm">{data.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {!data.paymentLink && data.totalDues > 0 && <button className="workspace-button primary" disabled={pending} onClick={() => link.mutate()}>{link.isPending ? "Creating…" : "Create payment link"}</button>}
                {tenantUrl && <a className="workspace-button" href={tenantUrl} target="_blank" rel="noopener noreferrer">WhatsApp tenant</a>}
                {parentUrl && <a className="workspace-button" href={parentUrl} target="_blank" rel="noopener noreferrer">WhatsApp parent</a>}
              </div>
              {link.error && <p role="alert" className="mt-3 text-sm text-rose-700">{link.error.message}</p>}
            </>}
          </>}
          {tab !== "Reminder" && <form className="workspace-form" key={tab} onSubmit={(event) => {
            event.preventDefault();
            if (!pending) save.mutate(new FormData(event.currentTarget));
          }}>
            <fieldset className="grid gap-4 sm:grid-cols-2" disabled={pending}>
              {tab === "Discount" && <>
                <label>Discount amount (₹)<input name="amount" type="number" min=".01" max="21474836.47" step=".01" required /></label>
                <label>Valid through<input name="validTill" type="date" required /></label>
                <label>Minimum payment<select value={minimum} onChange={(event) => setMinimum(event.target.value === "CUSTOM" ? "CUSTOM" : "FULL")}><option value="FULL">Full balance after discount</option><option value="CUSTOM">Set minimum amount</option></select></label>
                {minimum === "CUSTOM" && <label>Minimum amount (₹)<input name="minimumAmount" type="number" min=".01" max="21474836.47" step=".01" required /></label>}
              </>}
              <label className="sm:col-span-2">{tab === "Remark" ? "Remark" : "Reason"}<textarea name="description" rows={3} required maxLength={tab === "Remark" ? 2000 : 1000} /></label>
            </fieldset>
            {save.error && <p role="alert" className="mt-3 text-sm text-rose-700">{save.error.message}</p>}
            <button className="workspace-button primary mt-4" disabled={pending}>{save.isPending ? "Saving…" : `Save ${tab.toLowerCase()}`}</button>
          </form>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
