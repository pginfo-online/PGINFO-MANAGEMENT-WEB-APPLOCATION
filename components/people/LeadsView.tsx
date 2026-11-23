"use client";

import { useDeferredValue, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { api, type Lead } from "@/lib/api/client";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { formatDate, formatINR } from "@/lib/utils";
import { PageHeading, QueryError, Skeleton } from "../layout/WorkspaceUI";

const stages = ["NEW", "CONTACTED", "VISITED", "TOKEN_PAID", "CONVERTED", "LOST"];
const label = (status: string) => status.toLowerCase().replaceAll("_", " ");

export default function LeadsView() {
  const propertyId = usePropertyStore((state) => state.selectedPropertyId);
  const chooseProperty = useUiStore((state) => state.setPropertySelectorOpen);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Lead | null>();
  const term = useDeferredValue(search.trim());
  const stats = useQuery({
    queryKey: ["leads", "stats", propertyId],
    queryFn: ({ signal }) => api.leads.stats(propertyId ?? undefined, signal),
  });
  const leads = useQuery({
    queryKey: ["leads", propertyId, term, status, page],
    queryFn: ({ signal }) => api.leads.list({ propertyId: propertyId ?? undefined, search: term, status, page }, signal),
  });

  return (
    <>
      <PageHeading title="Leads" description="Track inquiries, visits and prospective tenants." action={
        <button className="workspace-button primary" onClick={() => propertyId ? setEditing(null) : chooseProperty(true)}><Plus className="size-4" />{propertyId ? "Add lead" : "Select property to add lead"}</button>
      } />
      <section className="mb-5" aria-label="Lead metrics">
        {stats.isPending && <Skeleton layout="metrics" />}
        {stats.error && <QueryError error={stats.error} retry={() => void stats.refetch()} />}
        {stats.data && <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Total leads", stats.data.total],
            ["New leads", stats.data.byStatus.NEW ?? 0],
            ["Visited", stats.data.byStatus.VISITED ?? 0],
            ["Conversion", `${stats.data.conversionRate}%`],
          ].map(([label, value]) => <div className="workspace-card p-4" key={label}><dt className="text-sm text-slate-600">{label}</dt><dd className="mt-1 text-xl font-semibold">{value}</dd></div>)}
        </dl>}
      </section>
      <div className="mb-5 flex flex-wrap gap-3">
        <label className="workspace-search max-w-sm"><Search className="size-4" /><input aria-label="Search leads" maxLength={100} placeholder="Search by name or phone" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
        <select className="workspace-button capitalize" aria-label="Lead status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="">All stages</option>{stages.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}
        </select>
      </div>
      {leads.isPending && <Skeleton layout="cards" />}
      {leads.error && <QueryError error={leads.error} retry={() => void leads.refetch()} />}
      {leads.isSuccess && !leads.data.data.length && <p className="workspace-card p-6 text-sm text-slate-600">No leads in this view.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {leads.data?.data.map((lead) => (
          <article className="workspace-card p-5" key={lead.id}>
            <div className="flex justify-between gap-2"><h2 className="text-lg font-semibold">{lead.name}</h2><span className="workspace-tag capitalize">{label(lead.status)}</span></div>
            <a className="mt-2 block text-sm underline underline-offset-2" href={`tel:${lead.mobile}`}>{lead.mobile}</a>
            {lead.visitScheduledAt && <p className="mt-2 text-sm text-slate-600">Visit {formatDate(lead.visitScheduledAt)}</p>}
            {lead.notes && <p className="mt-2 break-words text-sm text-slate-600">{lead.notes}</p>}
            <div className="mt-4 flex items-center justify-between gap-2"><span className="text-sm">{lead.budget ? `Budget ${formatINR(lead.budget)}` : ""}</span><button className="workspace-button" onClick={() => setEditing(lead)}>Edit lead</button></div>
          </article>
        ))}
      </div>
      {(page > 1 || leads.data?.meta.hasMore) && <div className="mt-5 flex justify-end gap-2"><button className="workspace-button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button className="workspace-button" disabled={!leads.data?.meta.hasMore} onClick={() => setPage(page + 1)}>Next</button></div>}
      {editing !== undefined && <LeadEditor lead={editing} propertyId={propertyId} close={() => setEditing(undefined)} />}
    </>
  );
}

function LeadEditor({ lead, propertyId, close }: { lead: Lead | null; propertyId: string | null; close: () => void }) {
  const client = useQueryClient();
  const update = useMutation({
    mutationFn: (input: Partial<Lead>) => lead ? api.leads.update(lead.id, input) : api.leads.create({ ...input, propertyId }),
    onSuccess() {
      void client.invalidateQueries({ queryKey: ["leads"] });
      toast.success(lead ? "Lead updated" : "Lead created");
      close();
    },
  });
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !update.isPending) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="workspace-overlay" />
        <Dialog.Content className="workspace-dialog">
          <div className="flex justify-between gap-3"><div><Dialog.Title className="text-xl font-semibold">{lead ? "Edit lead" : "Add lead"}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-600">Enter contact and visit details.</Dialog.Description></div><Dialog.Close className="workspace-icon" disabled={update.isPending} aria-label="Close lead editor"><X className="size-5" /></Dialog.Close></div>
          <form className="workspace-form mt-5" onSubmit={(event) => {
            event.preventDefault();
            if (update.isPending) return;
            const fields = new FormData(event.currentTarget);
            const value = (key: string) => String(fields.get(key) ?? "").trim();
            const visit = value("visit");
            update.mutate({ name: value("name"), mobile: value("mobile"), email: value("email") || undefined, budget: value("budget") ? Math.round(Number(value("budget")) * 100) : undefined, status: value("status") || undefined, notes: value("notes"), visitScheduledAt: visit ? new Date(visit).toISOString() : undefined });
          }}>
            <fieldset className="grid gap-4 sm:grid-cols-2" disabled={update.isPending}>
              <label>Name<input name="name" minLength={2} required defaultValue={lead?.name} /></label>
              <label>Mobile<input name="mobile" type="tel" required pattern="[6-9][0-9]{9}" defaultValue={lead?.mobile} /></label>
              <label>Email (optional)<input name="email" type="email" defaultValue={lead?.email} /></label>
              <label>Budget (₹)<input name="budget" type="number" min=".01" max="21474836.47" step=".01" defaultValue={lead?.budget ? lead.budget / 100 : undefined} /></label>
              <label>Schedule or change visit<input name="visit" type="datetime-local" /></label>
              {lead && <label>Stage<select name="status" className="capitalize" defaultValue={lead.status}>{stages.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}</select></label>}
              <label className="sm:col-span-2">Notes<textarea name="notes" rows={3} defaultValue={lead?.notes} /></label>
            </fieldset>
            {update.error && <p role="alert" className="mt-4 text-sm text-rose-700">{update.error.message}</p>}
            <div className="mt-5 flex justify-end gap-2"><Dialog.Close className="workspace-button" disabled={update.isPending}>Cancel</Dialog.Close><button className="workspace-button primary" disabled={update.isPending}>{update.isPending ? "Saving…" : "Save lead"}</button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
