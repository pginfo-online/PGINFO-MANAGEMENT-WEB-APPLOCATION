"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Plus, Search, Send, X } from "lucide-react";
import { toast } from "sonner";
import { api, authStorage } from "@/lib/api/client";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { formatINR } from "@/lib/utils";
import BalanceActions from "../money/BalanceActions";
import { PageHeading, QueryError, Skeleton } from "../layout/WorkspaceUI";

const statuses = [
  ["", "All statuses"], ["ACTIVE", "Active"], ["NOTICE_PERIOD", "On notice"],
  ["PENDING_MOVE_IN", "Expected"], ["MOVED_OUT", "Moved out"], ["ARCHIVED", "Archived"],
];

export default function TenantDirectoryTable({ former = false }: { former?: boolean }) {
  const { selectedPropertyId, activePropertyName } = usePropertyStore();
  const { setSelectedTenantForDue, setAnnouncementsOpen } = useUiStore();
  const [balanceId, setBalanceId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(former ? "MOVED_OUT" : "");
  const [pagination, setPagination] = useState({ scope: "", page: 1 });
  const term = useDeferredValue(search.trim());
  const scope = JSON.stringify([selectedPropertyId, term, status]);
  const page = pagination.scope === scope ? pagination.page : 1;
  const selectionScope = JSON.stringify([scope, page]);
  const [selection, setSelection] = useState<{ scope: string; ids: string[] }>({ scope: "", ids: [] });
  const [confirmation, setConfirmation] = useState<string[]>();
  const selected = selection.scope === selectionScope ? selection.ids : [];
  function select(id: string, checked: boolean) {
    setSelection({ scope: selectionScope, ids: checked ? [...selected, id] : selected.filter((item) => item !== id) });
  }
  const residents = useQuery({
    queryKey: ["residents", selectedPropertyId, term, status, page],
    queryFn: () => api.residents.list({ propertyId: selectedPropertyId ?? undefined, search: term, status, page, limit: 24 }),
  });

  const canRemind = ["OWNER", "ADMIN", "MANAGER"].includes(authStorage.getUser()?.activeOrganizationRole ?? "");
  const reminders = useMutation({
    mutationFn: (kind: "rent" | "autopay") => api.announcements.sendRentReminders({
      kind, channel: "WHATSAPP", propertyId: selectedPropertyId ?? undefined,
      residentIds: selected.length ? selected : undefined,
    }),
    onSuccess: (result) => toast.info(`${result.remindersSent} reminders accepted · ${result.failedCount} failures`),
    onError: (error) => toast.error(error.message),
  });
  const report = useMutation({
    mutationFn: () => api.reports.download("residents", { propertyId: selectedPropertyId ?? undefined }),
    onSuccess(csv) {
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "residents.csv";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    onError: (error) => toast.error(error.message),
  });
  function sendReminder(kind: "rent" | "autopay") {
    const scope = selected.length ? `${selected.length} selected tenants` : activePropertyName;
    if (confirm(`Send ${kind === "autopay" ? "autopay" : "rent payment"} reminders for ${scope}?`)) reminders.mutate(kind);
  }

  return (
    <>
      <PageHeading title={former ? "Former tenants" : "Tenants"} description={former ? "Review moved-out and archived resident records." : `Manage residents and their stays across ${selectedPropertyId ? activePropertyName : "all properties"}.`} action={former ? undefined :
        <div className="flex flex-wrap gap-2">
          <button className="workspace-button" onClick={() => setAnnouncementsOpen(true)}><Send className="size-4" /> Announcements</button>
          <Link href="/people/tenants/addTenant" className="workspace-button primary"><Plus className="size-4" /> Add tenant</Link>
        </div>
      } />
      {!former && canRemind && <div className="mb-4 flex flex-wrap gap-2">
        <button className="workspace-button" disabled={reminders.isPending} onClick={() => sendReminder("rent")}>WhatsApp rent reminders</button>
        <button className="workspace-button" disabled={reminders.isPending} onClick={() => sendReminder("autopay")}>Autopay reminders</button>
        <button className="workspace-button" disabled={report.isPending} onClick={() => report.mutate()}>Download tenant CSV</button>
      </div>}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="workspace-search max-w-sm"><Search className="size-4" /><input aria-label="Search tenants" placeholder="Search by name or phone" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={120} /></label>
        <select className="workspace-button" aria-label="Tenant status" value={status} onChange={(event) => setStatus(event.target.value)}>{(former ? statuses.slice(-2) : statuses).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
        {selected.length > 0 && <button className="workspace-button" onClick={() => setConfirmation(selected)}>Move out selected ({selected.length})</button>}
        {residents.data && <span className="ml-auto text-sm text-slate-600">{residents.data.meta.total} tenants</span>}
      </div>
      {residents.isPending && <Skeleton layout="cards" count={8} />}
      {residents.error && <QueryError error={residents.error} retry={() => void residents.refetch()} />}
      {residents.isSuccess && !residents.data.data.length && <p className="workspace-card p-8 text-sm text-slate-600">{search || status ? "No tenants match these filters." : "Add a tenant to start managing stays."}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {residents.data?.data.map((tenant) => {
          const name = [tenant.firstName, tenant.lastName].filter(Boolean).join(" ");
          return (
            <article className="workspace-card p-5" key={tenant.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="workspace-icon-tile font-semibold">{tenant.firstName?.[0]}{tenant.lastName?.[0]}</span>
                <div className="flex items-center gap-2">
                  <span className="workspace-tag">{statuses.find(([value]) => value === tenant.status)?.[1] ?? tenant.status}</span>
                  {!former && ["ACTIVE", "NOTICE_PERIOD"].includes(tenant.status) && <input type="checkbox" className="size-4 accent-emerald-800" aria-label={`Select ${name} for move-out`} checked={selected.includes(tenant.id)} onChange={(event) => select(tenant.id, event.target.checked)} />}
                </div>
              </div>
              <h2 className="mt-4 text-lg font-semibold">{name}</h2>
              <p className="mt-1 text-sm text-slate-600">{[tenant.property?.name, tenant.room?.roomNumber ? `Room ${tenant.room.roomNumber}` : null, tenant.bed?.bedNumber ? `Bed ${tenant.bed.bedNumber}` : null].filter(Boolean).join(" · ") || "Room unassigned"}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                {tenant.mobile && <a href={`tel:${tenant.mobile}`} className="underline decoration-slate-300 underline-offset-2">{tenant.mobile}</a>}
                {tenant.monthlyRent != null && <span>{formatINR(tenant.monthlyRent)} / month</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {typeof tenant.dues === "number" && <span className={tenant.isOverdue ? "text-rose-700" : "text-slate-600"}>Dues {formatINR(tenant.dues)}</span>}
                {typeof tenant.autopayActive === "boolean" && <span className="workspace-tag">{tenant.autopayActive ? "Autopay active" : "Autopay inactive"}</span>}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <Link href={`/people/tenants/${tenant.id}`} className="workspace-button">View profile <ArrowUpRight className="size-4" /></Link>
                {!former && tenant.mobile && <button className="workspace-button" onClick={() => setBalanceId(tenant.id)}>WhatsApp</button>}
                {["ACTIVE", "NOTICE_PERIOD"].includes(tenant.status) && <button className="workspace-button" onClick={() => setSelectedTenantForDue(tenant)}>Add due</button>}
              </div>
            </article>
          );
        })}
      </div>
      {(page > 1 || residents.data?.meta.hasMore) && <div className="mt-5 flex justify-end gap-2">
        <button className="workspace-button" disabled={page === 1} onClick={() => setPagination({ scope, page: page - 1 })}>Previous</button>
        <button className="workspace-button" disabled={!residents.data?.meta.hasMore} onClick={() => setPagination({ scope, page: page + 1 })}>Next</button>
      </div>}
      {balanceId && <BalanceActions id={balanceId} close={() => setBalanceId("")} />}
      {confirmation && <BulkMoveOut ids={confirmation} close={(saved) => {
        setConfirmation(undefined);
        if (saved) setSelection({ scope: selectionScope, ids: [] });
      }} />}
    </>
  );
}

function BulkMoveOut({ ids, close }: { ids: string[]; close: (saved: boolean) => void }) {
  const client = useQueryClient();
  const moveOut = useMutation({
    mutationFn: api.residents.bulkMoveOut,
    onSuccess() {
      for (const key of ["resident", "residents", "rooms", "inventoryStats", "dashboardMetrics", "money"]) void client.invalidateQueries({ queryKey: [key] });
      toast.success(ids.length === 1 ? "Move-out recorded" : "Move-outs recorded");
      close(true);
    },
  });
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !moveOut.isPending) close(false); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="workspace-overlay" />
        <Dialog.Content className="workspace-dialog">
          <div className="flex justify-between gap-3"><div><Dialog.Title className="text-xl font-semibold">Move out selected tenants</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-600">This closes {ids.length} {ids.length === 1 ? "stay" : "stays"} and releases the assigned beds.</Dialog.Description></div><Dialog.Close className="workspace-icon" aria-label="Close move-out form" disabled={moveOut.isPending}><X className="size-5" /></Dialog.Close></div>
          <form className="workspace-form mt-5" onSubmit={(event) => {
            event.preventDefault();
            if (moveOut.isPending) return;
            const fields = new FormData(event.currentTarget);
            moveOut.mutate({ residentIds: ids, moveOutDate: String(fields.get("date")), notes: String(fields.get("notes")).trim() || undefined, archive: fields.has("archive") });
          }}>
            <fieldset className="space-y-4" disabled={moveOut.isPending}>
              <label>Move-out date<input name="date" type="date" required /></label>
              <label>Notes (optional)<textarea name="notes" rows={2} maxLength={1000} /></label>
              <label style={{ display: "flex", alignItems: "center" }}><input className="max-w-4 accent-emerald-800" name="archive" type="checkbox" /> Archive records after move-out</label>
            </fieldset>
            {moveOut.error && <p role="alert" className="mt-4 text-sm text-rose-700">{moveOut.error.message}</p>}
            <div className="mt-5 flex justify-end gap-2"><Dialog.Close className="workspace-button" disabled={moveOut.isPending}>Cancel</Dialog.Close><button className="workspace-button primary" disabled={moveOut.isPending}>{moveOut.isPending ? "Saving…" : "Confirm move-out"}</button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
