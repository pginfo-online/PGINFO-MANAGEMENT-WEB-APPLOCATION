"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { Wallet, X } from "lucide-react";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { api } from "@/lib/api/client";
import { formatINR, formatDate } from "@/lib/utils";
import { PageHeading, QueryError, Skeleton } from "../layout/WorkspaceUI";

const modes = [["UPI", "UPI"], ["CASH", "Cash"], ["BANK_TRANSFER", "Bank transfer"], ["CHEQUE", "Cheque"], ["RAZORPAY", "Razorpay"]];

export default function CollectionsLedgerTable({ initialStatus = "" }: { initialStatus?: string }) {
  const propertyId = usePropertyStore((state) => state.selectedPropertyId) ?? undefined;
  const openPayment = useUiStore((state) => state.setReceivePaymentOpen);
  const [mode, setMode] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [receiptId, setReceiptId] = useState("");
  const [pagination, setPagination] = useState({ scope: "", page: 1 });
  const scope = JSON.stringify([propertyId, mode, status]);
  const page = pagination.scope === scope ? pagination.page : 1;
  const payments = useQuery({
    queryKey: ["payments", propertyId, mode, status, page],
    queryFn: () => api.payments.list({ propertyId, mode, status, page, limit: 25 }),
  });
  return (
    <>
      <PageHeading title="Collections" description="Review payments and retrieve confirmed receipts." action={<button className="workspace-button primary" onClick={() => openPayment(true)}><Wallet className="size-4" /> Record payment</button>} />
      <div className="mb-5 flex flex-wrap gap-3">
        <select className="workspace-button" aria-label="Payment method" value={mode} onChange={(event) => setMode(event.target.value)}><option value="">All payment methods</option>{modes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select className="workspace-button" aria-label="Payment status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="CONFIRMED">Confirmed</option><option value="DISPUTED">Disputed</option></select>
      </div>
      {payments.isPending && <Skeleton />}
      {payments.error && <QueryError error={payments.error} retry={() => void payments.refetch()} />}
      {payments.isSuccess && <div className="workspace-card divide-y divide-slate-100 px-5">
        {!payments.data.data.length && <p className="py-6 text-sm text-slate-600">No payments match this view.</p>}
        {payments.data.data.map((payment) => (
          <div key={payment.id} className="flex flex-wrap items-center gap-3 py-4">
            <div className="min-w-40 flex-1">
              <h2 className="font-semibold">{[payment.resident?.firstName, payment.resident?.lastName].filter(Boolean).join(" ") || "Resident"}</h2>
              <p className="mt-1 text-xs text-slate-600">{formatDate(payment.collectionDate)} · {modes.find(([value]) => value === payment.mode)?.[1] ?? payment.mode}</p>
            </div>
            <span className="workspace-tag">{payment.status}</span>
            <strong className="min-w-20 text-right tabular-nums">{formatINR(payment.amount)}</strong>
            {payment.status === "CONFIRMED" && <button className="workspace-button" onClick={() => setReceiptId(payment.id)}>Receipt</button>}
          </div>
        ))}
      </div>}
      {(page > 1 || payments.data?.meta.hasMore) && <div className="mt-5 flex justify-end gap-2"><button className="workspace-button" disabled={page === 1} onClick={() => setPagination({ scope, page: page - 1 })}>Previous</button><button className="workspace-button" disabled={!payments.data?.meta.hasMore} onClick={() => setPagination({ scope, page: page + 1 })}>Next</button></div>}
      {receiptId && <Receipt id={receiptId} close={() => setReceiptId("")} />}
    </>
  );
}

function Receipt({ id, close }: { id: string; close: () => void }) {
  const receipt = useQuery({ queryKey: ["payments", "receipt", id], queryFn: () => api.payments.getReceipt(id) });
  const item = receipt.data;
  const phone = String(item?.resident.mobile ?? "").replace(/\D/g, "");
  const whatsapp = /^[6-9]\d{9}$/.test(phone) ? "91" + phone : /^91[6-9]\d{9}$/.test(phone) ? phone : "";
  const detail = item ? [
    `Receipt ${item.receiptNumber}`,
    `Resident: ${item.resident.name}`, `Property: ${item.resident.property}`,
    `Amount: ${item.amountFormatted}`, `Received: ${formatDate(item.collectionDate)}`,
    `Method: ${item.mode}`, item.reference ? `Reference: ${item.reference}` : "",
  ].filter(Boolean).join("\n") : "";
  function download() {
    const url = URL.createObjectURL(new Blob([detail], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${item.receiptNumber}.txt`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="workspace-overlay" />
        <Dialog.Content className="workspace-dialog">
          <div className="flex justify-between gap-3"><div><Dialog.Title className="text-xl font-semibold">Payment receipt</Dialog.Title><Dialog.Description className="text-sm text-slate-600">Confirmed payment details</Dialog.Description></div><Dialog.Close className="workspace-icon" aria-label="Close receipt"><X className="size-5" /></Dialog.Close></div>
          {receipt.isPending && <div className="mt-5"><Skeleton count={2} /></div>}
          {receipt.error && <QueryError error={receipt.error} retry={() => void receipt.refetch()} />}
          {item && <>
            <p className="my-5 whitespace-pre-line rounded-lg bg-emerald-50 p-4 text-sm leading-7">{detail}</p>
            <div className="flex flex-wrap gap-2"><button className="workspace-button primary" onClick={download}>Download receipt</button>{whatsapp && <a className="workspace-button" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(detail)}`} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>}</div>
          </>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
