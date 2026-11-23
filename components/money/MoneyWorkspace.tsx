"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Search, Wallet } from "lucide-react";
import { api } from "@/lib/api/client";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { formatDate, formatINR } from "@/lib/utils";
import BalanceActions from "./BalanceActions";
import { PageHeading, QueryError, Skeleton } from "../layout/WorkspaceUI";

export default function MoneyWorkspace() {
  const propertyId = usePropertyStore((state) => state.selectedPropertyId) ?? undefined;
  const { setReceivePaymentOpen, setSelectedResidentForPayment } = useUiStore();
  const [balanceId, setBalanceId] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ scope: "", page: 1 });
  const term = useDeferredValue(search.trim());
  const scope = JSON.stringify([propertyId, term]);
  const page = pagination.scope === scope ? pagination.page : 1;
  const summary = useQuery({
    queryKey: ["money", "summary", propertyId],
    queryFn: ({ signal }) => api.money.summary(propertyId, signal),
  });
  const dues = useQuery({
    queryKey: ["money", "dues", propertyId, term, page],
    queryFn: ({ signal }) => api.money.dues({ propertyId, search: term, page }, signal),
  });

  return (
    <>
      <PageHeading title="Money" description="Review collections, expenses and tenant balances." action={<button className="workspace-button primary" onClick={() => setReceivePaymentOpen(true)}><Wallet className="size-4" /> Record payment</button>} />
      {summary.isPending && <Skeleton layout="metrics" />}
      {summary.error && <QueryError error={summary.error} retry={() => void summary.refetch()} />}
      {summary.data && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Outstanding dues", summary.data.allDues, "/money/dues"],
            ["Collections this month", summary.data.monthCollection, "/money/collection"],
            ["Expenses this month", summary.data.monthExpenses, "/money/expense"],
            [`Disputed payments (${summary.data.reconciliationCount})`, summary.data.reconciliationAmount, "/money/collection?status=DISPUTED"],
          ].map(([label, amount, href]) => (
            <Link href={String(href)} className="workspace-card interactive p-5" key={label}>
              <span className="flex justify-between gap-2 text-sm text-slate-600">{label}<ArrowUpRight className="size-4 shrink-0" /></span>
              <strong className="mt-3 block text-2xl tabular-nums">{formatINR(Number(amount))}</strong>
            </Link>
          ))}
        </div>
      )}
      <section aria-labelledby="tenant-balances" className="workspace-card mt-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold" id="tenant-balances">Tenant balances</h2>
          <label className="workspace-search max-w-xs"><Search className="size-4" /><input aria-label="Search tenant balances" maxLength={100} placeholder="Search tenants or rooms" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        </div>
        {dues.isPending && <Skeleton />}
        {dues.error && <QueryError error={dues.error} retry={() => void dues.refetch()} />}
        {dues.isSuccess && dues.data.data.length === 0 && <p className="py-6 text-sm text-slate-600">{term ? "No balances match your search." : "There are no outstanding balances in this view."}</p>}
        <div className="divide-y divide-slate-100">
          {dues.data?.data.map(({ id, resident, dueDate, overdueDays, outstanding }) => (
            <div className="flex flex-wrap items-center gap-3 py-3" key={id}>
              <div className="min-w-44 flex-1">
                <Link href={`/people/tenants/${id}`} className="font-semibold hover:underline">{[resident.firstName, resident.lastName].filter(Boolean).join(" ")}</Link>
                <p className="mt-1 text-xs text-slate-600">{[resident.property?.name, resident.room?.roomNumber ? `Room ${resident.room.roomNumber}` : null, `Due ${formatDate(dueDate)}`].filter(Boolean).join(" · ")}</p>
                {overdueDays > 0 && <p className="mt-1 text-xs text-rose-700">{overdueDays} days overdue</p>}
              </div>
              <strong className="tabular-nums">{formatINR(outstanding)}</strong>
              <button className="workspace-button" onClick={() => setBalanceId(id)}>Manage</button>
              <button className="workspace-button" onClick={() => setSelectedResidentForPayment({ ...resident, id })}>Collect</button>
            </div>
          ))}
        </div>
        {(page > 1 || dues.data?.meta.hasMore) && <div className="mt-4 flex justify-end gap-2">
          <button className="workspace-button" disabled={page === 1} onClick={() => setPagination({ scope, page: page - 1 })}>Previous</button>
          <button className="workspace-button" disabled={!dues.data?.meta.hasMore} onClick={() => setPagination({ scope, page: page + 1 })}>Next</button>
        </div>}
      </section>
      {balanceId && <BalanceActions id={balanceId} close={() => setBalanceId("")} />}
    </>
  );
}
