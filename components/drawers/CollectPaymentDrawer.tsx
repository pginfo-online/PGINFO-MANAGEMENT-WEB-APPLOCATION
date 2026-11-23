"use client";

import { useDeferredValue, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { formatDate, formatINR } from "@/lib/utils";
import { QueryError, Skeleton } from "../layout/WorkspaceUI";

function propertyToday() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default function CollectPaymentDrawer() {
  const { isReceivePaymentOpen, selectedResidentForPayment } = useUiStore();
  if (!isReceivePaymentOpen) return null;
  return <PaymentForm initialResident={selectedResidentForPayment} />;
}

function PaymentForm({ initialResident }: { initialResident: { id: string; firstName: string; lastName?: string; billingRecordId?: string } | null }) {
  const client = useQueryClient();
  const close = useUiStore((state) => state.setSelectedResidentForPayment);
  const propertyId = usePropertyStore((state) => state.selectedPropertyId) ?? undefined;
  const [residentId, setResidentId] = useState(initialResident?.id ?? "");
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState(initialResident?.billingRecordId ?? "");
  const [error, setError] = useState("");
  const previousCommand = useRef<{ signature: string; id: string } | null>(null);
  const term = useDeferredValue(search.trim());
  const residents = useQuery({
    queryKey: ["residents", "payment-picker", propertyId, term],
    queryFn: () => api.residents.list({ propertyId, search: term, limit: 25 }),
    enabled: !initialResident,
  });
  const context = useQuery({
    queryKey: ["money", "payment-context", residentId],
    queryFn: ({ signal }) => api.money.paymentContext(residentId, signal),
    enabled: !!residentId,
  });
  const mutation = useMutation({
    mutationFn: api.money.record,
    onSuccess() {
      for (const key of ["money", "dashboardMetrics", "billing", "payments", "residents", "resident"]) {
        void client.invalidateQueries({ queryKey: [key] });
      }
      toast.success("Payment recorded");
      close(null);
    },
  });
  const bills = context.data?.bills ?? [];
  const eligible = selectedBill ? bills.filter((bill) => bill.id === selectedBill) : bills;
  const available = eligible.reduce((total, bill) => total + bill.amount - bill.paidAmount, 0);
  const displayedAmount = amount ?? (available ? (available / 100).toFixed(2) : "");
  const today = propertyToday();

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !mutation.isPending) close(null); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="workspace-overlay" />
        <Dialog.Content className="workspace-dialog">
          <div className="flex justify-between gap-3">
            <div><Dialog.Title className="text-xl font-semibold">Record payment</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-600">Apply an offline payment to outstanding dues.</Dialog.Description></div>
            <Dialog.Close className="workspace-icon" aria-label="Close payment form" disabled={mutation.isPending}><X className="size-5" /></Dialog.Close>
          </div>
          <form className="workspace-form mt-5" onSubmit={(event) => {
            event.preventDefault();
            if (mutation.isPending || !context.data) return;
            setError("");
            const form = new FormData(event.currentTarget);
            const paise = Math.round(Number(form.get("amount")) * 100);
            if (!Number.isSafeInteger(paise) || paise <= 0 || paise > available || paise > 2147483647) {
              setError("Enter a payment amount within the outstanding balance.");
              return;
            }
            let remaining = paise;
            const allocations = [];
            for (const bill of eligible) {
              if (!remaining) break;
              const applied = Math.min(remaining, bill.amount - bill.paidAmount);
              allocations.push({ billingRecordId: bill.id, amount: applied });
              remaining -= applied;
            }
            if (allocations.length > 100) {
              setError("Record payments for up to 100 dues at a time.");
              return;
            }
            const payment = {
              residentId, amount: paise, allocations,
              mode: String(form.get("mode")),
              collectionDate: String(form.get("collectionDate")),
              notes: String(form.get("notes")).trim() || undefined,
            };
            const signature = JSON.stringify(payment);
            if (previousCommand.current?.signature !== signature) {
              previousCommand.current = { signature, id: crypto.randomUUID() };
            }
            mutation.mutate({ ...payment, idempotencyKey: previousCommand.current.id });
          }}>
            <fieldset disabled={mutation.isPending} className="space-y-4">
              {initialResident ? <p className="workspace-tag inline-block">{[initialResident.firstName, initialResident.lastName].filter(Boolean).join(" ")}</p> : <>
                <label>Find tenant<input maxLength={120} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or phone" /></label>
                {residents.isPending && <Skeleton count={1} />}
                {residents.error && <QueryError error={residents.error} retry={() => void residents.refetch()} />}
                <label>Tenant<select required value={residentId} onChange={(event) => { setResidentId(event.target.value); setAmount(null); setSelectedBill(""); }}>
                  <option value="">Choose a tenant</option>
                  {residents.data?.data.map((resident) => <option key={resident.id} value={resident.id}>{[resident.firstName, resident.lastName, resident.mobile].filter(Boolean).join(" ")}</option>)}
                </select></label>
              </>}
              {residentId && context.isPending && <Skeleton count={2} />}
              {context.error && <QueryError error={context.error} retry={() => void context.refetch()} />}
              {context.isSuccess && bills.length === 0 && <p className="text-sm text-slate-600">This tenant has no outstanding dues.</p>}
              {bills.length > 0 && <>
                <label>Apply payment to<select value={selectedBill} onChange={(event) => { setSelectedBill(event.target.value); setAmount(null); }}>
                  <option value="">Oldest dues first</option>
                  {bills.map((bill) => <option key={bill.id} value={bill.id}>{bill.type.replaceAll("_", " ")} · {formatDate(bill.dueDate)} · {formatINR(bill.amount - bill.paidAmount)}</option>)}
                </select></label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>Amount (₹)<input name="amount" type="number" min=".01" max={Math.min(available, 2147483647) / 100} step=".01" required value={displayedAmount} onChange={(event) => setAmount(event.target.value)} /></label>
                  <label>Date received<input name="collectionDate" type="date" max={today} defaultValue={today} required /></label>
                </div>
                <label>Payment method<select name="mode"><option value="UPI">UPI</option><option value="CASH">Cash</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CHEQUE">Cheque</option></select></label>
                <label>Notes or reference (optional)<textarea name="notes" maxLength={1000} rows={2} /></label>
              </>}
            </fieldset>
            {(error || mutation.error) && <p role="alert" className="mt-4 text-sm text-rose-700">{error || mutation.error?.message}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close className="workspace-button" disabled={mutation.isPending}>Cancel</Dialog.Close>
              <button className="workspace-button primary" disabled={mutation.isPending || !eligible.length}>{mutation.isPending ? "Recording…" : "Record payment"}</button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
