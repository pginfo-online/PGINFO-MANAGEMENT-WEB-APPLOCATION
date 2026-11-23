"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Phone, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { useUiStore } from "@/lib/store";
import { formatDate, formatDateTime, formatINR } from "@/lib/utils";
import ChangeAllocationDialog from "./ChangeAllocationDialog";
import { PageHeading, QueryError, Skeleton } from "../layout/WorkspaceUI";

type Action = "edit" | "notice" | "move-out";
type View = "Charges" | "Payments" | "Activity";

export default function TenantProfile360({ tenantId }: { tenantId: string }) {
  const [showAllocation, setShowAllocation] = useState(false);
  const [action, setAction] = useState<Action>();
  const [view, setView] = useState<View>("Charges");
  const { setSelectedTenantForDue, setSelectedResidentForPayment } = useUiStore();
  const profile = useQuery({ queryKey: ["resident", tenantId], queryFn: () => api.residents.get(tenantId) });
  const dues = useQuery({ queryKey: ["billing", "resident", tenantId], queryFn: () => api.billing.list({ residentId: tenantId, limit: 20 }), enabled: profile.isSuccess && view === "Charges" });
  const payments = useQuery({ queryKey: ["payments", "resident", tenantId], queryFn: () => api.payments.list({ residentId: tenantId, limit: 20 }), enabled: profile.isSuccess && view === "Payments" });
  const activity = useQuery({ queryKey: ["resident", tenantId, "activity"], queryFn: ({ signal }) => api.dashboard.activity("Resident", tenantId, signal), enabled: profile.isSuccess && view === "Activity" });
  if (profile.isPending) return <Skeleton layout="cards" count={5} />;
  if (profile.error) return <QueryError error={profile.error} retry={() => void profile.refetch()} />;
  const tenant = profile.data;
  const name = [tenant.firstName, tenant.lastName].filter(Boolean).join(" ");
  const active = ["ACTIVE", "NOTICE_PERIOD"].includes(tenant.status);
  const date = (value?: string) => value ? formatDate(value) : "—";
  const entries = view === "Charges" ? dues : view === "Payments" ? payments : activity;
  const records = entries.data?.data ?? [];

  return (
    <>
      <Link className="workspace-button mb-4" href="/people/tenants"><ArrowLeft className="size-4" /> Tenants</Link>
      <PageHeading title={name} description={[tenant.property?.name, tenant.room?.roomNumber && `Room ${tenant.room.roomNumber}`, tenant.bed?.bedNumber && `Bed ${tenant.bed.bedNumber}`].filter(Boolean).join(" · ") || "Resident profile"} action={
        <div className="flex flex-wrap gap-2">
          {tenant.mobile && <a href={`tel:${tenant.mobile}`} className="workspace-button"><Phone className="size-4" /> Call</a>}
          {tenant.parentPhone && <a href={`tel:${tenant.parentPhone}`} className="workspace-button"><Phone className="size-4" /> Call parent</a>}
          <button className="workspace-button" onClick={() => setAction("edit")}>Edit profile</button>
          {active && <button className="workspace-button primary" onClick={() => setSelectedResidentForPayment(tenant)}>Record payment</button>}
        </div>
      } />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(15rem,1fr)_minmax(0,2fr)]">
        <section className="workspace-card p-5">
          <div className="flex justify-between gap-3"><h2 className="font-semibold">Tenancy</h2><span className="workspace-tag">{tenant.status?.replaceAll("_", " ")}</span></div>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ["Mobile", tenant.mobile], ["Email", tenant.email], ["Joined", date(tenant.joiningDate)],
              ["Expected move-out", date(tenant.expectedVacatingDate)], ["Moved out", date(tenant.moveOutDate)],
              ["Monthly rent", formatINR(tenant.monthlyRent)], ["Security deposit", formatINR(tenant.securityDeposit)],
              ["Outstanding", formatINR(tenant.financialSummary?.outstandingBalance)],
            ].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-1"><dt className="text-slate-600">{label}</dt><dd className="break-all font-medium">{value || "—"}</dd></div>)}
          </dl>
          {active && <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button className="workspace-button" onClick={() => setSelectedTenantForDue(tenant)}>Add due</button>
            <button className="workspace-button" onClick={() => setShowAllocation(true)}>Change room or property</button>
            <button className="workspace-button" onClick={() => setAction("notice")}>Record notice</button>
            <button className="workspace-button" onClick={() => setAction("move-out")}>Move out</button>
          </div>}
        </section>
        <section className="workspace-card min-w-0 p-5">
          <div className="workspace-tabs mb-4">
            {(["Charges", "Payments", "Activity"] as const).map((item) => <button className="workspace-button" key={item} aria-pressed={view === item} onClick={() => setView(item)}>{item}</button>)}
          </div>
          {entries.isPending && <Skeleton />}
          {entries.error && <QueryError error={entries.error} retry={() => void entries.refetch()} />}
          {entries.isSuccess && records.length === 0 && <p className="py-5 text-sm text-slate-600">No {view.toLowerCase()} recorded.</p>}
          {records.length > 0 && <ul className="divide-y divide-slate-100">
            {records.map((item) => (
              <li className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm" key={item.id}>
                <div><strong>{view === "Charges" ? item.description || item.type : view === "Payments" ? item.mode.replaceAll("_", " ") : item.action.replaceAll(/[._]/g, " ")}</strong><p className="mt-1 text-xs text-slate-600">{view === "Charges" ? date(item.dueDate) : view === "Payments" ? date(item.collectionDate) : formatDateTime(item.createdAt)}</p></div>
                {view !== "Activity" && <div className="text-right"><strong>{formatINR(item.amount)}</strong><p className="text-xs text-slate-600">{item.status?.replaceAll("_", " ")}</p></div>}
              </li>
            ))}
          </ul>}
          {entries.data?.meta.hasMore && <p className="mt-3 text-xs text-slate-600">Showing the latest 20 records.</p>}
        </section>
      </div>
      {showAllocation && <ChangeAllocationDialog tenant={tenant} close={() => setShowAllocation(false)} />}
      {action && <TenantEditor tenant={tenant} action={action} close={() => setAction(undefined)} />}
    </>
  );
}

interface TenantEditorDetails {
  id: string;
  firstName: string;
  lastName?: string;
  mobile: string;
  email?: string;
  expectedVacatingDate?: string;
}

function TenantEditor({ tenant, action, close }: { tenant: TenantEditorDetails; action: Action; close: () => void }) {
  const client = useQueryClient();
  const title = action === "edit" ? "Edit tenant profile" : action === "notice" ? "Record notice" : "Move out tenant";
  const mutation = useMutation({
    mutationFn: (form: FormData) => {
      const field = (key: string) => String(form.get(key) ?? "").trim();
      if (action === "notice") return api.residents.notice(tenant.id, { date: field("date"), reason: field("reason") });
      if (action === "move-out") return api.residents.moveOut(tenant.id, { moveOutDate: field("date"), notes: field("reason") || undefined });
      return api.residents.update(tenant.id, { firstName: field("firstName"), lastName: field("lastName"), mobile: field("mobile"), email: field("email") || undefined });
    },
    onSuccess() {
      for (const key of ["resident", "residents", "rooms", "inventoryStats", "dashboardMetrics", "money"]) void client.invalidateQueries({ queryKey: [key] });
      toast.success(action === "edit" ? "Profile updated" : action === "notice" ? "Notice recorded" : "Move-out recorded");
      close();
    },
  });
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !mutation.isPending) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="workspace-overlay" />
        <Dialog.Content className="workspace-dialog">
          <div className="flex justify-between gap-3"><div><Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-600">{action === "move-out" ? "Confirm the move-out date to close the stay and release the bed." : [tenant.firstName, tenant.lastName].filter(Boolean).join(" ")}</Dialog.Description></div><Dialog.Close className="workspace-icon" aria-label="Close tenant form" disabled={mutation.isPending}><X className="size-5" /></Dialog.Close></div>
          <form className="workspace-form mt-5" onSubmit={(event) => { event.preventDefault(); if (!mutation.isPending) mutation.mutate(new FormData(event.currentTarget)); }}>
            <fieldset className="grid gap-4 sm:grid-cols-2" disabled={mutation.isPending}>
              {action === "edit" ? <>
                <label>First name<input name="firstName" required minLength={2} defaultValue={tenant.firstName} /></label>
                <label>Last name<input name="lastName" defaultValue={tenant.lastName} /></label>
                <label>Mobile<input name="mobile" type="tel" required pattern="[6-9][0-9]{9}" defaultValue={tenant.mobile} /></label>
                <label>Email<input name="email" type="email" defaultValue={tenant.email} /></label>
              </> : <>
                <label>Date<input name="date" type="date" required defaultValue={tenant.expectedVacatingDate?.slice(0, 10)} /></label>
                <label className="sm:col-span-2">{action === "notice" ? "Reason" : "Notes (optional)"}<textarea name="reason" rows={3} required={action === "notice"} maxLength={1000} /></label>
              </>}
            </fieldset>
            {mutation.error && <p role="alert" className="mt-4 text-sm text-rose-700">{mutation.error.message}</p>}
            <div className="mt-5 flex justify-end gap-2"><Dialog.Close className="workspace-button" disabled={mutation.isPending}>Cancel</Dialog.Close><button className="workspace-button primary" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : title}</button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
