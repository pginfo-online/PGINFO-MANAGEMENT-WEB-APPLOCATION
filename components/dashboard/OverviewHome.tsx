"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  BarChart3,
  BedDouble,
  Building2,
  CalendarClock,
  ChevronRight,
  ClipboardPlus,
  FileCheck2,
  FileSpreadsheet,
  Gauge,
  Globe,
  MessageCircle,
  MessageSquareWarning,
  Plus,
  Receipt,
  Send,
  Settings,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { formatINR } from "@/lib/utils";
import { QueryError, Skeleton } from "../layout/WorkspaceUI";
import {
  FinancialsAccordionCard,
  IssuesAndReportsRow,
  JourneyCard,
  OccupancyDonutCard,
  PropertyOverviewSection,
  TrustFooterBanner,
} from "./OverviewSections";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type PeriodMode = "live" | "previous" | "fy";

export default function OverviewHome() {
  const { selectedPropertyId, setSelectedPropertyId } = usePropertyStore();
  const ui = useUiStore();
  const [periodMode, setPeriodMode] = useState<PeriodMode>("live");
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showMoreShortcuts, setShowMoreShortcuts] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const periodQuery =
    periodMode === "live"
      ? undefined
      : periodMode === "previous"
        ? { month: prevMonth, year: prevYear }
        : { month: currentMonth, year: currentYear, fy: "true" as const };

  const overview = useQuery({
    queryKey: ["dashboardMetrics", "overview", selectedPropertyId, periodMode],
    queryFn: ({ signal }) =>
      api.dashboard.getOverview(selectedPropertyId ?? undefined, periodQuery, signal),
  });

  const data = overview.data;
  const monthLabel = data
    ? MONTH_NAMES[(data.period.month - 1) % 12]
    : MONTH_NAMES[(currentMonth - 1) % 12];
  const periodLabel =
    periodMode === "live"
      ? "Live"
      : periodMode === "previous"
        ? monthLabel
        : "FY";

  type QuickActionItem = {
    name: string;
    icon: typeof UserPlus;
    href?: string;
    run?: () => void;
  };

  const quickActions: QuickActionItem[] = [
    { name: "Add Tenant", icon: UserPlus, href: "/people/tenants/addTenant" },
    { name: "Add Complaint", icon: MessageSquareWarning, run: () => ui.setAddComplaintOpen(true) },
    { name: "Collect Payment", icon: ArrowDownLeft, run: () => ui.setReceivePaymentOpen(true) },
    { name: "Send Announcement", icon: Send, run: () => ui.setAnnouncementsOpen(true) },
    { name: "Add Expense", icon: Receipt, run: () => ui.setAddExpenseOpen(true) },
    { name: "Add Dues", icon: ClipboardPlus, run: () => ui.setAddRentDuesOpen(true) },
  ];

  const extraActions: QuickActionItem[] = [
    { name: "Add Room", icon: BedDouble, run: () => ui.setAddRoomOpen(true) },
    { name: "Add Property", icon: Building2, run: () => ui.setAddPropertyOpen(true) },
    { name: "Add Staff", icon: Users, run: () => ui.setAddStaffOpen(true) },
  ];

  const shortcuts = [
    { name: "All Reports", icon: FileSpreadsheet, href: "/reports" },
    { name: "WhatsApp", icon: MessageCircle, href: "/whatsapp/tenants" },
    { name: "Food Menu", icon: UtensilsCrossed, href: "/property/food" },
    { name: "Property Settings", icon: Settings, href: "/settings" },
    { name: "Listings", icon: Globe, href: "/listings" },
    { name: "Bed Map", icon: CalendarClock, href: "/property/bed-availability" },
    { name: "Meters", icon: Gauge, href: "/property/meters" },
    { name: "Dues Packages", icon: Wallet, href: "/money/dues-package" },
  ];

  const extraShortcuts = [
    { name: "Bank Accounts", icon: Building2, href: "/money/banks" },
    { name: "Analytics", icon: BarChart3, href: "/analytics" },
    { name: "Team Access", icon: Users, href: "/people/team" },
  ];

  interface PendingTaskItem {
    title: string;
    subtitle: string;
    cta: string;
    href: string;
  }

  const pendingTaskItems: PendingTaskItem[] = data
    ? [
        ...(data.pendingTasks.tenantsWithoutIdProof > 0
          ? [
              {
                title: `${data.pendingTasks.tenantsWithoutIdProof} Tenants KYC Pending`,
                subtitle: "Verify the tenant's ID proof document",
                cta: "Verify Now",
                href: "/people/tenants?kyc=PENDING",
              },
            ]
          : []),
        ...(data.pendingTasks.tenantsWithoutAgreement > 0
          ? [
              {
                title: `${data.pendingTasks.tenantsWithoutAgreement} Tenants Without Agreement`,
                subtitle: "Upload or link signed rental agreement",
                cta: "Get Signed",
                href: "/people/tenants",
              },
            ]
          : []),
        ...(data.pendingTasks.pendingComplaints > 0
          ? [
              {
                title: `${data.pendingTasks.pendingComplaints} Active Complaints`,
                subtitle: "Review and resolve open maintenance requests",
                cta: "Review",
                href: "/property/complaints",
              },
            ]
          : []),
        ...(data.pendingTasks.rentDefaulters > 0
          ? [
              {
                title: `${data.pendingTasks.rentDefaulters} Rent Defaulters`,
                subtitle: "Send WhatsApp reminders or record payments",
                cta: "Collect Dues",
                href: "/money/dues",
              },
            ]
          : []),
      ]
    : [];

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Top Overview Strip */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Overview</h1>
            <span
              title="Real-time operational and financial snapshot"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500"
            >
              i
            </span>
          </div>
          <select
            aria-label="Overview timeframe"
            value={periodMode}
            onChange={(e) => setPeriodMode(e.target.value as PeriodMode)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="live">Live</option>
            <option value="previous">Last Month</option>
            <option value="fy">Financial Year</option>
          </select>
        </div>

        {overview.isPending && <Skeleton layout="metrics" count={4} />}
        {overview.error && (
          <QueryError error={overview.error} retry={() => void overview.refetch()} />
        )}

        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
            {/* Detailed Dashboard CTA Card */}
            <Link
              href="/analytics"
              className="group flex flex-col justify-between rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-white p-3.5 transition hover:border-indigo-300 hover:shadow-sm"
            >
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <div className="mt-4 flex items-end justify-between gap-1">
                <span className="text-xs font-bold text-slate-800 leading-snug">
                  View
                  <br />
                  Detailed
                  <br />
                  Dashboard
                </span>
                <ChevronRight className="h-4 w-4 text-indigo-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
              </div>
            </Link>

            {[
              {
                label: "Todays Collection",
                value: formatINR(data.financial.todayCollectedPaise ?? 0, true),
                href: "/money/collection",
                icon: ArrowDownLeft,
                badge: "bg-emerald-50 text-emerald-600",
              },
              {
                label: `${monthLabel} Collection`,
                value: formatINR(data.financial.monthCollectedPaise ?? 0, true),
                href: "/money/collection",
                icon: Wallet,
                badge: "bg-emerald-50 text-emerald-600",
              },
              {
                label: `${monthLabel} Dues`,
                value: formatINR(data.financial.monthOutstandingPaise ?? 0, true),
                href: "/money/dues",
                icon: Receipt,
                badge: "bg-blue-50 text-blue-600",
              },
              {
                label: "All Time Dues",
                value: formatINR(data.financial.outstandingBalancePaise, true),
                href: "/money/dues",
                icon: FileCheck2,
                badge: "bg-indigo-50 text-indigo-600",
              },
              {
                label: "Vacant Beds",
                value: String(data.operational.availableBeds),
                href: "/property/bed-availability",
                icon: BedDouble,
                badge: "bg-rose-50 text-rose-500",
              },
              {
                label: "Occupied Beds",
                value: String(data.operational.occupiedBeds),
                href: "/property/bed-availability",
                icon: BedDouble,
                badge: "bg-emerald-50 text-emerald-600",
              },
              {
                label: "Active Complaints",
                value: String(data.operational.pendingComplaints),
                href: "/property/complaints",
                icon: ShieldAlert,
                badge: "bg-amber-50 text-amber-600",
              },
            ].map(({ label, value, href, icon: Icon, badge }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 transition hover:border-slate-300 hover:shadow-sm"
              >
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${badge}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="mt-3">
                  <p className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums truncate">
                    {value}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500 truncate">{label}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 2. Property Overview */}
      {data && (
        <PropertyOverviewSection
          properties={data.properties}
          monthLabel={monthLabel}
          selectedPropertyId={selectedPropertyId}
          onSelectProperty={(id, name) =>
            setSelectedPropertyId(selectedPropertyId === id ? null : id, selectedPropertyId === id ? "All properties" : name)
          }
          onAddProperty={() => ui.setAddPropertyOpen(true)}
        />
      )}

      {/* 3. Quick Actions */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap items-start gap-4 sm:gap-7">
          {[...quickActions, ...(showMoreActions ? extraActions : [])].map(
            ({ name, icon: Icon, href, run }) => {
              const inner = (
                <>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="max-w-[5.2rem] text-center text-xs font-medium text-slate-700 leading-tight">
                    {name}
                  </span>
                </>
              );
              return href ? (
                <Link key={name} href={href} className="group flex flex-col items-center gap-2">
                  {inner}
                </Link>
              ) : (
                <button
                  key={name}
                  type="button"
                  onClick={run}
                  className="group flex flex-col items-center gap-2 cursor-pointer"
                >
                  {inner}
                </button>
              );
            },
          )}
          <button
            type="button"
            onClick={() => setShowMoreActions((prev) => !prev)}
            className="group flex flex-col items-center gap-2 cursor-pointer"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition group-hover:bg-slate-50">
              {showMoreActions ? <Plus className="h-4 w-4 rotate-45 transition" /> : <ChevronRight className="h-4 w-4" />}
            </span>
            <span className="text-xs font-medium text-slate-700">
              {showMoreActions ? "Less" : "View More"}
            </span>
          </button>
        </div>
      </section>

      {/* 4. Shortcuts */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">Shortcuts</h2>
        <div className="flex flex-wrap items-start gap-4 sm:gap-7">
          {[...shortcuts, ...(showMoreShortcuts ? extraShortcuts : [])].map(
            ({ name, icon: Icon, href }) => (
              <Link key={name} href={href} className="group flex flex-col items-center gap-2">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="max-w-[5.2rem] text-center text-xs font-medium text-slate-700 leading-tight">
                  {name}
                </span>
              </Link>
            ),
          )}
          <button
            type="button"
            onClick={() => setShowMoreShortcuts((prev) => !prev)}
            className="group flex flex-col items-center gap-2 cursor-pointer"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition group-hover:bg-slate-50">
              {showMoreShortcuts ? <Plus className="h-4 w-4 rotate-45 transition" /> : <ChevronRight className="h-4 w-4" />}
            </span>
            <span className="text-xs font-medium text-slate-700">
              {showMoreShortcuts ? "Less" : "View More"}
            </span>
          </button>
        </div>
      </section>

      {/* 5. Pending Tasks & Occupancy */}
      {data && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Pending Tasks */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Pending Tasks</h2>
              <Link
                href="/people/tenants"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <span>View All</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {pendingTaskItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center">
                <p className="text-sm font-semibold text-emerald-900">All caught up!</p>
                <p className="mt-1 text-xs text-emerald-700">
                  No pending KYC verifications, agreements, complaints, or overdue rent balances.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTaskItems.map((task) => (
                  <div
                    key={task.title}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <ShieldAlert className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{task.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{task.subtitle}</p>
                      </div>
                    </div>
                    <Link
                      href={task.href}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-950 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-900 transition shrink-0"
                    >
                      <span>{task.cta}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Occupancy */}
          <OccupancyDonutCard breakdown={data.occupancyBreakdown} periodLabel={periodLabel} />
        </div>
      )}

      {/* 6. Financials & Journey */}
      {data && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <FinancialsAccordionCard financial={data.financial} />
          <JourneyCard journey={data.journey} periodLabel={periodLabel} />
        </div>
      )}

      {/* 7. Issues Overview & Upcoming Reports */}
      {data && (
        <IssuesAndReportsRow issuesOverview={data.issuesOverview} periodLabel={periodLabel} />
      )}

      {/* 8. Footer Trust Banner */}
      <TrustFooterBanner />
    </div>
  );
}
