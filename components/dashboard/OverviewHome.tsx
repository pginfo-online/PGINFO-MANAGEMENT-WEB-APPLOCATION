"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowRight, BedDouble, Building2, ChartNoAxesCombined, ClipboardPlus, MessageSquareWarning, Receipt, Send, Users, UserRoundPlus, Wallet } from "lucide-react";
import { api } from "@/lib/api/client";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { formatINR } from "@/lib/utils";
import { QueryError, Skeleton } from "../layout/WorkspaceUI";

export default function OverviewHome() {
  const { selectedPropertyId, activePropertyName } = usePropertyStore();
  const ui = useUiStore();
  const metrics = useQuery({
    queryKey: ["dashboardMetrics", selectedPropertyId],
    queryFn: () => api.dashboard.getMetrics(selectedPropertyId ?? undefined),
  });
  const actions = [
    { name: "Add tenant", icon: UserRoundPlus, href: "/people/tenants/addTenant" },
    { name: "Collect payment", icon: Wallet, run: () => ui.setReceivePaymentOpen(true) },
    { name: "Add due", icon: ClipboardPlus, run: () => ui.setAddRentDuesOpen(true) },
    { name: "Add expense", icon: Receipt, run: () => ui.setAddExpenseOpen(true) },
    { name: "Complaints", icon: MessageSquareWarning, href: "/property/complaints" },
    { name: "Announcements", icon: Send, run: () => ui.setAnnouncementsOpen(true) },
  ];
  const financial = metrics.data?.financial;
  const operational = metrics.data?.operational;
  return (
    <div className="space-y-7">
      <section className="workspace-hero">
        <div className="relative z-10">
          <p className="mb-3 flex items-center gap-2 text-sm text-emerald-100"><Building2 className="size-4" />{activePropertyName}</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Workspace overview</h1>
          <p className="mt-3 max-w-lg text-sm text-emerald-50/85">Track occupancy and collections, and take care of day-to-day property operations.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/analytics" className="workspace-button"><ChartNoAxesCombined className="size-4" /> View analytics <ArrowRight className="size-4" /></Link>
            <button className="workspace-button hero-secondary" onClick={() => ui.setPropertySelectorOpen(true)}>{selectedPropertyId ? "Switch property" : "Choose a property"}</button>
          </div>
        </div>
        <Building2 className="pointer-events-none absolute -bottom-16 right-5 hidden size-80 text-white/10 sm:block" strokeWidth={0.6} aria-hidden="true" />
      </section>
      {metrics.isPending && <Skeleton layout="metrics" />}
      {metrics.error && <QueryError error={metrics.error} retry={() => void metrics.refetch()} />}
      {operational && financial && (
        <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Today's collection", value: formatINR(financial.todayCollectedPaise), icon: ArrowDownLeft, href: "/money/collection" },
            { label: "Outstanding dues", value: formatINR(financial.outstandingBalancePaise), icon: Wallet, href: "/money/dues" },
            { label: "Available beds", value: `${operational.availableBeds} of ${operational.totalBeds}`, icon: BedDouble, href: "/property/bed-availability" },
            { label: "Current tenants", value: operational.currentResidents, icon: Users, href: "/people/tenants" },
          ].map(({ label, value, icon: Icon, href }) => (
            <Link href={href} className="workspace-card interactive p-5" key={label}>
              <div className="flex items-center justify-between gap-2 text-sm text-slate-600">{label}<span className="workspace-icon-tile"><Icon className="size-4" /></span></div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
            </Link>
          ))}
        </section>
      )}
      <section className="workspace-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {actions.map(({ name, icon: Icon, href, run }) => {
            const content = <><span className="workspace-icon-tile"><Icon className="size-5" /></span><span>{name}</span></>;
            return href ? <Link className="workspace-action" href={href} key={name}>{content}</Link> : <button className="workspace-action" key={name} onClick={run}>{content}</button>;
          })}
        </div>
      </section>
      {operational && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/people/bookings" className="workspace-card interactive flex items-center justify-between p-5"><span>Upcoming move-ins</span><strong>{operational.upcomingMoveIns}</strong></Link>
          <Link href="/property/complaints" className="workspace-card interactive flex items-center justify-between p-5"><span>Pending complaints</span><strong>{operational.pendingComplaints}</strong></Link>
        </div>
      )}
    </div>
  );
}
