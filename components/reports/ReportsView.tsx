"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { api } from "@/lib/api/client";
import { usePropertyStore } from "@/lib/store";
import { PageHeading } from "../layout/WorkspaceUI";

const reports = [
  ["dues", "Dues", "Outstanding tenant balances"],
  ["collections", "Collections", "Payments received and their payment methods"],
  ["expenses", "Expenses", "Recorded operating expenses"],
  ["residents", "Resident registry", "Tenant records and room assignments"],
] as const;

export default function ReportsView() {
  const propertyId = usePropertyStore((state) => state.selectedPropertyId) ?? undefined;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [mode, setMode] = useState("");
  const download = useMutation({
    mutationFn: async (kind: (typeof reports)[number][0]) => {
      if (kind !== "residents" && startDate && endDate && startDate > endDate) throw new Error("End date must be on or after the start date.");
      const filters = kind === "residents" ? {} : { startDate, endDate, mode: kind === "collections" ? mode : undefined };
      const csv = await api.reports.download(kind, { propertyId, ...filters });
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${kind}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });

  return (
    <>
      <PageHeading title="Reports" description="Export CSV reports for the selected property or the full workspace." />
      <fieldset className="workspace-card workspace-form mb-5 grid gap-4 p-4 sm:grid-cols-3">
        <label>From date<input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label>Through date<input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} /></label>
        <label>Collections payment method<select value={mode} onChange={(event) => setMode(event.target.value)}><option value="">All methods</option><option>UPI</option><option value="CASH">Cash</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CHEQUE">Cheque</option><option value="RAZORPAY">Razorpay</option></select></label>
      </fieldset>
      {download.error && <p className="mb-4 text-sm text-rose-700" role="alert">{download.error.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reports.map(([kind, title, description]) => (
          <article className="workspace-card flex flex-col items-start p-5" key={kind}>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mb-5 mt-1 flex-1 text-sm text-slate-600">{description}</p>
            <button className="workspace-button" disabled={download.isPending} onClick={() => download.mutate(kind)}><Download className="size-4" />{download.isPending && download.variables === kind ? "Exporting…" : "Export CSV"}</button>
          </article>
        ))}
      </div>
    </>
  );
}
