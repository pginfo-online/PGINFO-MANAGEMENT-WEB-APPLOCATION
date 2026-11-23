"use client";

import { useDeferredValue, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { api, type DuePackage, type DuePackageInput } from "@/lib/api/client";
import { formatINR } from "@/lib/utils";
import { PageHeading, QueryError, Skeleton } from "../layout/WorkspaceUI";

const propertyTypes = ["PG", "HOSTEL", "CO_LIVING", "FLAT", "APARTMENT", "RK", "OTHER"];
const categories = ["Rent", "Deposit", "Electricity", "Water", "Internet", "Food", "Housekeeping", "Laundry", "Maintenance", "Repair", "Late Fine", "Damage Fine", "Key Charges", "Parking", "Common Areas", "KYC", "Agreement", "Move-out Charges"];

export default function DuesPackageGrid() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<DuePackage | null>();
  const term = useDeferredValue(search.trim());
  const packages = useQuery({
    queryKey: ["money", "packages", term, page],
    queryFn: ({ signal }) => api.money.packages({ search: term, page }, signal),
  });

  return (
    <>
      <PageHeading title="Due packages" description="Manage reusable fixed and variable billing packages." action={<button className="workspace-button primary" onClick={() => setEditing(null)}><Plus className="size-4" /> Add package</button>} />
      <label className="workspace-search mb-5 max-w-sm"><Search className="size-4" /><input aria-label="Search packages" maxLength={100} placeholder="Search packages" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
      {packages.isPending && <Skeleton layout="cards" />}
      {packages.error && <QueryError error={packages.error} retry={() => void packages.refetch()} />}
      {packages.isSuccess && !packages.data.data.length && <p className="workspace-card p-6 text-sm text-slate-600">{term ? "No packages match your search." : "Create a package to define reusable charges."}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {packages.data?.data.map((item) => (
          <article className="workspace-card p-5" key={item.id}>
            <div className="flex items-center justify-between gap-2"><span className="workspace-icon-tile"><Package className="size-5" /></span><span className="workspace-tag">{item.isActive ? "Active" : "Disabled"}</span></div>
            <h2 className="mt-4 text-lg font-semibold">{item.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{item.category} · {item.propertyType.replaceAll("_", " ")}</p>
            <div className="mt-4 flex items-center justify-between gap-2"><strong>{item.billing === "FIXED" ? formatINR(item.amount) : "Variable amount"}</strong><button className="workspace-button" onClick={() => setEditing(item)}>Edit</button></div>
          </article>
        ))}
      </div>
      {(page > 1 || packages.data?.meta.hasMore) && <div className="mt-5 flex justify-end gap-2">
        <button className="workspace-button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
        <button className="workspace-button" disabled={!packages.data?.meta.hasMore} onClick={() => setPage(page + 1)}>Next</button>
      </div>}
      {editing !== undefined && <PackageEditor item={editing} close={() => setEditing(undefined)} />}
    </>
  );
}

function PackageEditor({ item, close }: { item: DuePackage | null; close: () => void }) {
  const [billing, setBilling] = useState(item?.billing ?? "FIXED");
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: DuePackageInput) => api.money.savePackage(payload, item?.id),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["money", "packages"] });
      toast.success(item ? "Package updated" : "Package created");
      close();
    },
  });

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !mutation.isPending) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="workspace-overlay" />
        <Dialog.Content className="workspace-dialog">
          <div className="flex justify-between gap-3"><div><Dialog.Title className="text-xl font-semibold">{item ? "Edit package" : "Add package"}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-600">Define a charge for a property type.</Dialog.Description></div><Dialog.Close className="workspace-icon" disabled={mutation.isPending} aria-label="Close package editor"><X className="size-5" /></Dialog.Close></div>
          <form className="workspace-form mt-5" onSubmit={(event) => {
            event.preventDefault();
            if (mutation.isPending) return;
            const form = new FormData(event.currentTarget);
            mutation.mutate({
              name: String(form.get("name")).trim(),
              category: String(form.get("category")),
              propertyType: String(form.get("propertyType")),
              billing,
              amount: billing === "VARIABLE" ? 0 : Math.round(Number(form.get("amount")) * 100),
              description: String(form.get("description")).trim(),
              isActive: form.get("active") === "yes",
              version: item?.version,
            });
          }}>
            <fieldset className="grid gap-4 sm:grid-cols-2" disabled={mutation.isPending}>
              <label className="sm:col-span-2">Name<input name="name" required minLength={2} maxLength={100} defaultValue={item?.name} /></label>
              <label>Property type<select name="propertyType" defaultValue={item?.propertyType}>{propertyTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></label>
              <label>Category<select name="category" defaultValue={item?.category}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>Billing<select value={billing} onChange={(event) => setBilling(event.target.value === "FIXED" ? "FIXED" : "VARIABLE")}><option value="FIXED">Fixed amount</option><option value="VARIABLE">Variable amount</option></select></label>
              {billing === "FIXED" && <label>Amount (₹)<input name="amount" type="number" min=".01" max="21474836.47" step=".01" required defaultValue={item?.amount ? item.amount / 100 : undefined} /></label>}
              <label>Status<select name="active" defaultValue={item?.isActive === false ? "no" : "yes"}><option value="yes">Active</option><option value="no">Disabled</option></select></label>
              <label className="sm:col-span-2">Description<textarea name="description" rows={3} maxLength={1000} defaultValue={item?.description} /></label>
            </fieldset>
            {mutation.error && <p role="alert" className="mt-4 text-sm text-rose-700">{mutation.error.message}</p>}
            <div className="mt-5 flex justify-end gap-2"><Dialog.Close className="workspace-button" disabled={mutation.isPending}>Cancel</Dialog.Close><button className="workspace-button primary" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save package"}</button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
