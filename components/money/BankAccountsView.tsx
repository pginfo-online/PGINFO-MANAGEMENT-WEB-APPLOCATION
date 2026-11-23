"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, Link2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { api, authStorage } from "@/lib/api/client";
import { usePropertyStore } from "@/lib/store";
import { PageHeading, QueryError, Skeleton } from "../layout/WorkspaceUI";

export default function BankAccountsView() {
  const propertyId = usePropertyStore((state) => state.selectedPropertyId) ?? undefined;
  const [selection, setSelection] = useState<{ id: string; name: string }>();
  const [pagination, setPagination] = useState({ propertyId, page: 1 });
  const page = pagination.propertyId === propertyId ? pagination.page : 1;
  const accounts = useQuery({
    queryKey: ["payouts", propertyId, page],
    queryFn: ({ signal }) => api.payouts.list({ propertyId, page }, signal),
  });
  const client = useQueryClient();
  const canManage = ["OWNER", "ADMIN"].includes(authStorage.getUser()?.activeOrganizationRole ?? "");
  const refresh = useMutation({
    mutationFn: api.payouts.refresh,
    onSuccess() {
      void client.invalidateQueries({ queryKey: ["payouts"] });
      toast.success("Verification status updated");
    },
    onError(error) { toast.error(error.message); },
  });
  return (
    <>
      <PageHeading title="Bank accounts" description="Review Razorpay payout accounts and property links." />
      {accounts.isPending && <Skeleton layout="cards" />}
      {accounts.error && <QueryError error={accounts.error} retry={() => void accounts.refetch()} />}
      {accounts.isSuccess && !accounts.data.data.length && <p className="workspace-card p-6 text-sm text-slate-600">No payout accounts are linked in this view.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.data?.data.map((account) => (
          <article className="workspace-card p-5" key={account.id}>
            <div className="flex items-center justify-between gap-3"><span className="workspace-icon-tile"><Landmark className="size-5" /></span><span className="workspace-tag">{account.status}</span></div>
            <h2 className="mt-4 text-lg font-semibold">{account.beneficiaryName || account.businessName}</h2>
            <p className="mt-1 text-sm text-slate-600">{account.accountNumberMasked} · {account.ifscCode}</p>
            <p className="mt-2 text-sm text-slate-600">{account.property?.name ?? "Organization default"} · KYC {account.kycStatus.replaceAll("_", " ")}</p>
            {canManage && <div className="mt-4 flex flex-wrap gap-2">
              <button className="workspace-button" onClick={() => setSelection({ id: account.id, name: account.beneficiaryName || account.businessName })}><Link2 className="size-4" /> Link property</button>
              {account.metadata?.routeProductId && <button className="workspace-button" disabled={refresh.isPending} onClick={() => refresh.mutate(account.id)}><RefreshCw className="size-4" /> Check verification</button>}
            </div>}
          </article>
        ))}
      </div>
      {(page > 1 || accounts.data?.meta.hasMore) && <div className="mt-5 flex justify-end gap-2"><button className="workspace-button" disabled={page === 1} onClick={() => setPagination({ propertyId, page: page - 1 })}>Previous</button><button className="workspace-button" disabled={!accounts.data?.meta.hasMore} onClick={() => setPagination({ propertyId, page: page + 1 })}>Next</button></div>}
      {selection && <LinkProperty account={selection} close={() => setSelection(undefined)} />}
    </>
  );
}

function LinkProperty({ account, close }: { account: { id: string; name: string }; close: () => void }) {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const properties = useQuery({
    queryKey: ["properties", "payout-picker", search, page],
    queryFn: () => api.properties.list({ search: search.trim(), page }),
  });
  const link = useMutation({
    mutationFn: (propertyId: string | null) => api.payouts.link(account.id, propertyId),
    onSuccess() {
      void client.invalidateQueries({ queryKey: ["payouts"] });
      toast.success("Payout account link updated");
      close();
    },
  });
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !link.isPending) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="workspace-overlay" />
        <Dialog.Content className="workspace-dialog">
          <div className="flex justify-between gap-3"><div><Dialog.Title className="text-xl font-semibold">Link payout account</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-600">{account.name}</Dialog.Description></div><Dialog.Close className="workspace-icon" disabled={link.isPending} aria-label="Close property picker"><X className="size-5" /></Dialog.Close></div>
          <label className="workspace-search my-4"><input aria-label="Search properties" placeholder="Search properties" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
          {properties.isPending && <Skeleton count={3} />}
          {properties.error && <QueryError error={properties.error} retry={() => void properties.refetch()} />}
          <div className="space-y-2">
            <button className="property-option" disabled={link.isPending} onClick={() => link.mutate(null)}>Use as organization default</button>
            {properties.data?.data.map((property) => <button className="property-option" key={property.id} disabled={link.isPending} onClick={() => link.mutate(property.id)}>{property.name}</button>)}
          </div>
          {(page > 1 || properties.data?.meta.hasMore) && <div className="mt-4 flex justify-end gap-2"><button className="workspace-button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button className="workspace-button" disabled={!properties.data?.meta.hasMore} onClick={() => setPage(page + 1)}>Next</button></div>}
          {link.error && <p role="alert" className="mt-4 text-sm text-rose-700">{link.error.message}</p>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
