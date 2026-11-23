"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { usePropertyStore } from "@/lib/store";
import { formatINR } from "@/lib/utils";
import { PageHeading, QueryError, Skeleton } from "../layout/WorkspaceUI";

const sections = ["Overview", "Financials", "Occupancy", "Tenants", "Issues"] as const;
type Metric = [label: string, value: string | number];

export default function DetailedDashboardView() {
  const { selectedPropertyId, activePropertyName } = usePropertyStore();
  const [month, setMonth] = useState(() => new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit",
  }).format(new Date()));
  const [fiscalYear, setFiscalYear] = useState(false);
  const [section, setSection] = useState<(typeof sections)[number]>("Overview");
  const [year, monthNumber] = month.split("-").map(Number);
  const metrics = useQuery({
    queryKey: ["dashboardMetrics", selectedPropertyId, month, fiscalYear],
    queryFn: ({ signal }) => api.dashboard.getMetrics(selectedPropertyId ?? undefined, { month: monthNumber, year, fy: fiscalYear ? "true" : undefined }, signal),
  });

  const data = metrics.data;
  let rows: Metric[] = [];
  if (data) {
    const { operational: op, financial: fin } = data;
    const groups: Record<(typeof sections)[number], Metric[]> = {
      Overview: [["Properties", op.totalProperties], ["Rooms", op.totalRooms], ["Current residents", op.currentResidents], ["Net cash flow", formatINR(fin.netCashflowPaise)]],
      Financials: [["Total billed", formatINR(fin.totalBilledPaise)], ["Total collected", formatINR(fin.totalCollectedPaise)], ["Outstanding", formatINR(fin.outstandingBalancePaise)], ["Expenses", formatINR(fin.totalExpensesPaise)], ["Net cash flow", formatINR(fin.netCashflowPaise)], ["Held deposits", formatINR(fin.securityDepositsHeldPaise)]],
      Occupancy: [["Total beds", op.totalBeds], ["Occupied", op.occupiedBeds], ["Available", op.availableBeds], ["Occupancy rate", `${op.occupancyRate}%`]],
      Tenants: [["Current residents", op.currentResidents], ["On notice", op.noticePeriodTenants], ["Moved in during period", op.periodMoveIns], ["Moved out during period", op.periodMoveOuts], ["Current bookings", op.currentBookings], ["Active leads", op.activeLeads], ["Rent defaulters", op.rentDefaulters]],
      Issues: [["Pending complaints", op.pendingComplaints], ["Reported during period", op.periodComplaintsCreated], ["Resolved during period", op.periodComplaintsResolved]],
    };
    rows = groups[section];
  }

  return (
    <>
      <PageHeading title="Analytics" description={`Operational and financial metrics for ${activePropertyName}.`} action={
        <div className="flex items-center gap-2">
          <input className="workspace-button" type="month" aria-label="Reporting month" min="2000-01" max={`${new Date().getFullYear() + 1}-12`} value={month} onChange={(event) => { if (event.target.value && event.target.validity.valid) setMonth(event.target.value); }} />
          <button className="workspace-button" aria-pressed={fiscalYear} onClick={() => setFiscalYear(!fiscalYear)}>{fiscalYear ? "Financial year" : "Monthly view"}</button>
        </div>
      } />
      <div aria-label="Analytics views" className="workspace-tabs">
        {sections.map((item) => <button className="workspace-button whitespace-nowrap" key={item} aria-pressed={section === item} onClick={() => setSection(item)}>{item}</button>)}
      </div>
      {metrics.isPending && <Skeleton layout="metrics" />}
      {metrics.error && <QueryError error={metrics.error} retry={() => void metrics.refetch()} />}
      {!!rows.length && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(([label, value]) => <div className="workspace-card p-5" key={label}><div className="text-sm text-slate-600">{label}</div><strong className="mt-2 block text-2xl tabular-nums">{value}</strong></div>)}
      </div>}
      {data && section === "Occupancy" && <div className="workspace-card mt-5 p-5">
        <label className="block text-sm font-semibold" htmlFor="bed-occupancy">Beds occupied</label>
        <progress className="mt-3 h-4 w-full accent-emerald-700" id="bed-occupancy" value={data.operational.occupiedBeds} max={data.operational.totalBeds || 1} />
      </div>}
    </>
  );
}
