"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { usePropertyStore } from "@/lib/store";
import { formatDate, formatINR } from "@/lib/utils";
import { addCalendarMonths, maxPaise, openingRentDueDate, rentFrequencies, toPaise } from "@/lib/tenant-onboarding";
import { PageHeading } from "../layout/WorkspaceUI";
import AllocationFields, { type Allocation, useAllocationInventory } from "./AllocationFields";

const dueTypes = ["RENT", "SECURITY_DEPOSIT", "ELECTRICITY", "WATER", "MAINTENANCE", "LATE_FEE", "OTHER"];
const modes = ["UPI", "CASH", "BANK_TRANSFER", "CHEQUE", "OTHER"];
const tenantTypes = ["STUDENT", "PROFESSIONAL", "BACHELOR", "FAMILY", "COUPLE", "STAFF", "OTHER"];
const moneyField = { type: "number", step: ".01", min: "0", max: "21474836.47" } as const;

interface Entry {
  id: string;
  kind: "due" | "collection";
  type: string;
  amount: string;
  collected: string;
  date: string;
  end: string;
  mode: string;
  description: string;
}

export default function AddTenantWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const client = useQueryClient();
  const selectedProperty = usePropertyStore((state) => state.selectedPropertyId);
  const fullNameParam = (params.get("name") ?? "").trim();
  const [defaultFirstName, ...defaultLastParts] = fullNameParam ? fullNameParam.split(/\s+/) : [""];
  const defaultLastName = defaultLastParts.join(" ");
  const defaultMobile = (params.get("mobile") ?? "").replace(/\D/g, "").slice(0, 10);
  const [allocation, setAllocation] = useState<Allocation>(() => ({
    propertyId: params.get("propertyId") ?? selectedProperty ?? "",
    roomId: params.get("roomId") ?? "",
    bedId: params.get("bedId") ?? "",
  }));
  const [rent, setRent] = useState<string | null>(null);
  const [deposit, setDeposit] = useState("0");
  const [frequency, setFrequency] = useState(1);
  const [includeRent, setIncludeRent] = useState(true);
  const [start, setStart] = useState(() => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()));
  const [dueDay, setDueDay] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const onboardingKey = useRef<string | undefined>(undefined);
  const inventory = useAllocationInventory(allocation);
  const { property, selectedRoom, beds, detail } = inventory;
  const suggestedRent = beds.find((bed) => bed.id === allocation.bedId)?.rentAmount ?? selectedRoom?.rentAmount;
  const rentInput = rent ?? (suggestedRent == null ? "" : String(suggestedRent / 100));
  const dueDayInput = dueDay ?? String(property.data?.rentDueDay ?? 1);
  const rentPaise = toPaise(rentInput);
  const depositPaise = toPaise(deposit);
  const openingRent = (rentPaise || 0) * frequency;
  const charges = (includeRent ? openingRent : 0) + (depositPaise || 0) + entries.reduce((sum, entry) => sum + (entry.kind === "due" ? toPaise(entry.amount) || 0 : 0), 0);
  const applied = entries.reduce((sum, entry) => sum + (entry.kind === "due" ? toPaise(entry.collected) || 0 : 0), 0);
  const standalone = entries.reduce((sum, entry) => sum + (entry.kind === "collection" ? toPaise(entry.amount) || 0 : 0), 0);
  const openingDate = openingRentDueDate(start, Number(dueDayInput));

  const create = useMutation({
    mutationFn: api.residents.create,
    onSuccess(resident) {
      for (const key of ["resident", "residents", "room", "rooms", "inventoryStats", "dashboardMetrics", "money", "billing", "payments"]) void client.invalidateQueries({ queryKey: [key] });
      toast.success("Tenant added");
      router.replace(`/people/tenants/${resident.id}`);
    },
  });

  function updateEntry(id: string, fields: Partial<Entry>) {
    setEntries((items) => items.map((entry) => entry.id === id ? { ...entry, ...fields } : entry));
  }

  function addEntry(kind: Entry["kind"]) {
    setEntries((items) => [...items, { id: crypto.randomUUID(), kind, type: "OTHER", amount: "", collected: "", date: start, end: "", mode: "UPI", description: "" }]);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (create.isPending || create.isSuccess) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const field = (key: string) => String(form.get(key) ?? "").trim();
    const fail = (message: string) => setError(message);
    if (!property.data || (allocation.roomId && (!selectedRoom || !detail.isSuccess)) || (allocation.bedId && !beds.some((bed) => bed.id === allocation.bedId))) return fail("Check the property, room and bed selection.");
    if (!field("firstName")) return fail("Enter the tenant’s first name.");
    if (!(rentPaise > 0) || openingRent > maxPaise || !Number.isFinite(depositPaise)) return fail("Enter valid rent and deposit amounts. Rent for one billing period must fit within ₹2,14,74,836.47.");
    if (!openingDate || (field("moveOut") && field("moveOut") < start)) return fail("Check the rent due day and stay dates.");
    if (entries.some((entry) => !(toPaise(entry.amount) > 0) || !entry.date ||
      (entry.kind === "due" && ((entry.collected !== "" && (!Number.isFinite(toPaise(entry.collected)) || toPaise(entry.collected) > toPaise(entry.amount))) || (entry.end && entry.end < entry.date))))) return fail("Check each opening entry. A payment applied to a due cannot exceed that due.");
    const lockIn = Number(field("lockIn"));
    // Keep the same identifier if the server saves the resident but the response is lost.
    onboardingKey.current ??= crypto.randomUUID();
    create.mutate({
      onboardingKey: onboardingKey.current,
      propertyId: allocation.propertyId,
      roomId: allocation.roomId || undefined,
      bedId: allocation.bedId || undefined,
      firstName: field("firstName"), lastName: field("lastName"), mobile: field("mobile"),
      email: field("email") || undefined,
      alternatePhone: field("alternatePhone") || undefined,
      parentName: field("parentName") || undefined,
      parentPhone: field("parentPhone") || undefined,
      sendWhatsappReminder: form.has("whatsapp"),
      stayType: field("stayType"), tenantType: field("tenantType"),
      profession: field("tenantType") === "STUDENT" ? "STUDENT" : field("tenantType") === "PROFESSIONAL" ? "WORKING_PROFESSIONAL" : "OTHER",
      joiningDate: start, moveInDate: start, expectedVacatingDate: field("moveOut") || undefined,
      lockInEndDate: lockIn ? addCalendarMonths(start, lockIn) : undefined,
      noticePeriodDays: Number(field("notice")), agreementPeriodMonths: Number(field("agreement")),
      monthlyRent: rentPaise, securityDeposit: depositPaise, rentDueDay: Number(dueDayInput),
      rentalFrequencyMonths: frequency, initialRent: includeRent ? "CREATE" : "SKIP",
      notes: field("notes"),
      openingBalances: entries.map((entry) => ({
        type: entry.kind === "due" ? entry.type : "OTHER",
        amount: entry.kind === "due" ? toPaise(entry.amount) : 0,
        collectedAmount: entry.kind === "collection" ? toPaise(entry.amount) : toPaise(entry.collected) || 0,
        dueDate: entry.date, dueEndDate: entry.kind === "due" ? entry.end || undefined : undefined,
        collectionDate: entry.date, collectionMode: entry.mode, description: entry.description.trim(),
      })),
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading title="Add tenant" description="Enter their details, stay terms and opening balances." action={<Link href="/people/tenants" className="workspace-button">Back to tenants</Link>} />
      <form className="workspace-form" onSubmit={submit}>
        <fieldset className="space-y-5" disabled={create.isPending || create.isSuccess}>
          <section className="workspace-card space-y-4 p-5">
            <h2 className="text-lg font-semibold">Tenant details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>First name<input name="firstName" required autoComplete="given-name" defaultValue={defaultFirstName} /></label>
              <label>Last name<input name="lastName" autoComplete="family-name" defaultValue={defaultLastName} /></label>
              <label>Mobile<input name="mobile" required type="tel" pattern="[6-9][0-9]{9}" maxLength={10} defaultValue={defaultMobile} /></label>
              <label>Email (optional)<input name="email" type="email" /></label>
              <label>Alternate phone (optional)<input name="alternatePhone" type="tel" pattern="[6-9][0-9]{9}" maxLength={10} /></label>
              <label>Tenant type<select name="tenantType" defaultValue="PROFESSIONAL">{tenantTypes.map((type) => <option key={type} value={type}>{type.toLowerCase()}</option>)}</select></label>
              <label>Parent name (optional)<input name="parentName" /></label>
              <label>Parent phone (optional)<input name="parentPhone" type="tel" pattern="[6-9][0-9]{9}" maxLength={10} /></label>
            </div>
            <label className="!flex items-center gap-2"><input className="max-w-4" type="checkbox" name="whatsapp" defaultChecked /> Enable WhatsApp reminders</label>
          </section>
          <section className="workspace-card space-y-4 p-5">
            <h2 className="text-lg font-semibold">Stay and rent</h2>
            <AllocationFields value={allocation} change={setAllocation} inventory={inventory} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label>Move-in date<input type="date" required value={start} onChange={(event) => setStart(event.target.value)} /></label>
              <label>Expected move-out (optional)<input name="moveOut" type="date" min={start} /></label>
              <label>Stay type<select name="stayType"><option value="LONG_TERM">Long term</option><option value="SHORT_TERM">Short term</option></select></label>
              <label>Monthly rent (₹)<input {...moneyField} min=".01" required value={rentInput} onChange={(event) => setRent(event.target.value)} /></label>
              <label>Security deposit (₹)<input {...moneyField} required value={deposit} onChange={(event) => setDeposit(event.target.value)} /></label>
              <label>Rental frequency<select value={frequency} onChange={(event) => setFrequency(Number(event.target.value))}>{rentFrequencies.map((months) => <option value={months} key={months}>{months === 1 ? "Monthly" : `Every ${months} months`}</option>)}</select></label>
              <label>Rent due day<input type="number" required min={1} max={28} value={dueDayInput} onChange={(event) => setDueDay(event.target.value)} /></label>
              <label>Lock-in (months)<input name="lockIn" type="number" min={0} max={120} defaultValue={0} required /></label>
              <label>Notice period (days)<input name="notice" type="number" min={0} max={365} defaultValue={30} required /></label>
              <label>Agreement (months)<input name="agreement" type="number" min={1} max={120} defaultValue={11} required /></label>
              <label className="sm:col-span-2">Remarks (optional)<textarea name="notes" rows={2} /></label>
            </div>
          </section>
          <section className="workspace-card space-y-4 p-5">
            <h2 className="text-lg font-semibold">Opening balances</h2>
            <label className="!flex items-center gap-2"><input className="max-w-4" type="checkbox" checked={includeRent} onChange={(event) => setIncludeRent(event.target.checked)} /> Create opening rent {includeRent && openingDate ? `due ${formatDate(openingDate)}` : ""}</label>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div><dt>Opening rent</dt><dd className="font-semibold">{formatINR(includeRent ? openingRent : 0)}</dd></div>
              <div><dt>Security deposit</dt><dd className="font-semibold">{formatINR(depositPaise)}</dd></div>
              <div><dt>Total charges</dt><dd className="font-semibold">{formatINR(charges)}</dd></div>
              <div><dt>Applied collections</dt><dd className="font-semibold">{formatINR(applied)}</dd></div>
              <div><dt>Standalone collections</dt><dd className="font-semibold">{formatINR(standalone)}</dd></div>
              <div><dt>Outstanding on creation</dt><dd className="font-semibold">{formatINR(charges - applied)}</dd></div>
            </dl>
            {entries.map((entry, index) => (
              <div className="space-y-3 rounded-lg border border-slate-200 p-4" key={entry.id}>
                <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{entry.kind === "due" ? "Due" : "Collection"} {index + 1}</h3><button className="workspace-button" type="button" onClick={() => setEntries((items) => items.filter((item) => item.id !== entry.id))}>Remove</button></div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {entry.kind === "due" && <label>Due type<select value={entry.type} onChange={(event) => updateEntry(entry.id, { type: event.target.value })}>{dueTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ").toLowerCase()}</option>)}</select></label>}
                  <label>Amount (₹)<input {...moneyField} min=".01" required value={entry.amount} onChange={(event) => updateEntry(entry.id, { amount: event.target.value })} /></label>
                  <label>{entry.kind === "due" ? "Due date" : "Collection date"}<input type="date" required value={entry.date} onChange={(event) => updateEntry(entry.id, { date: event.target.value })} /></label>
                  {entry.kind === "due" && <>
                    <label>Period end (optional)<input type="date" min={entry.date} value={entry.end} onChange={(event) => updateEntry(entry.id, { end: event.target.value })} /></label>
                    <label>Already collected (₹)<input {...moneyField} value={entry.collected} onChange={(event) => updateEntry(entry.id, { collected: event.target.value })} /></label>
                  </>}
                  {(entry.kind === "collection" || Number(entry.collected) > 0) && <label>Payment method<select value={entry.mode} onChange={(event) => updateEntry(entry.id, { mode: event.target.value })}>{modes.map((mode) => <option key={mode}>{mode}</option>)}</select></label>}
                  <label>Note (optional)<input maxLength={500} value={entry.description} onChange={(event) => updateEntry(entry.id, { description: event.target.value })} /></label>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="workspace-button" disabled={entries.length >= 20} onClick={() => addEntry("due")}>Add due</button>
              <button type="button" className="workspace-button" disabled={entries.length >= 20} onClick={() => addEntry("collection")}>Add collection</button>
            </div>
          </section>
        </fieldset>
        {(error || create.error) && <p role="alert" className="mt-4 text-sm text-rose-700">{error || create.error?.message}</p>}
        <div className="mt-5 flex justify-end"><button className="workspace-button primary" disabled={create.isPending || create.isSuccess}>{create.isPending ? "Saving…" : "Add tenant"}</button></div>
      </form>
    </div>
  );
}
