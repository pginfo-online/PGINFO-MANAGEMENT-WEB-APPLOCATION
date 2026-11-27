"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  BedDouble,
  Building2,
  CalendarCheck2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  FileText,
  IndianRupee,
  Plus,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Users,
  UserX,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import type { DashboardOverviewData, OverviewPropertyCard } from "@/lib/api/client";
import { formatINR } from "@/lib/utils";

export function PropertyOverviewSection({
  properties,
  monthLabel,
  selectedPropertyId,
  onSelectProperty,
  onAddProperty,
}: {
  properties: OverviewPropertyCard[];
  monthLabel: string;
  selectedPropertyId: string | null;
  onSelectProperty: (id: string, name: string) => void;
  onAddProperty: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollByCards = (direction: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
  };

  const copyCode = async (code: string, name: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied Property ID for ${name}`);
    } catch {
      toast.error("Unable to copy Property ID");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">Property Overview</h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label="Scroll properties left"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label="Scroll properties right"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">No active properties yet</p>
            <p className="mt-1 text-xs text-slate-600">
              Add your first PG, hostel, or apartment property to see live occupancy and collection cards here.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddProperty}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Property</span>
          </button>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth"
        >
          {properties.map((prop) => {
            const pct = prop.totalBeds > 0 ? Math.min(100, Math.round((prop.occupiedBeds / prop.totalBeds) * 100)) : 0;
            const isSelected = selectedPropertyId === prop.id;
            return (
              <article
                key={prop.id}
                className={`min-w-[270px] sm:min-w-[300px] max-w-[320px] shrink-0 snap-start rounded-2xl border p-4 transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/30"
                    : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectProperty(prop.id, prop.name)}
                    className="text-left group cursor-pointer"
                  >
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition">
                      {prop.name}
                    </h3>
                  </button>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {prop.type.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <span>PgInfo ID: {prop.code}</span>
                  <button
                    type="button"
                    onClick={() => void copyCode(prop.code, prop.name)}
                    aria-label={`Copy ID for ${prop.name}`}
                    className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-3.5 rounded-xl bg-slate-100/80 p-3">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                    <span>Occupied Beds</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {prop.occupiedBeds}/{prop.totalBeds}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <dl className="mt-4 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-2.5 text-slate-600">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                        <Users className="h-3.5 w-3.5" />
                      </span>
                      Active Tenants
                    </dt>
                    <dd className="font-bold text-slate-900 tabular-nums">{prop.activeTenants}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-2.5 text-slate-600">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <UserX className="h-3.5 w-3.5" />
                      </span>
                      Under Eviction
                    </dt>
                    <dd className="font-bold text-slate-900 tabular-nums">{prop.underEvictionCount}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-2.5 text-slate-600">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                        <CalendarCheck2 className="h-3.5 w-3.5" />
                      </span>
                      Current Bookings
                    </dt>
                    <dd className="font-bold text-slate-900 tabular-nums">{prop.currentBookings}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-2.5 text-slate-600">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </span>
                      Pending Dues
                    </dt>
                    <dd className="font-bold text-slate-900 tabular-nums">
                      {formatINR(prop.pendingDuesPaise, true)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-2.5 text-slate-600">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <IndianRupee className="h-3.5 w-3.5" />
                      </span>
                      {monthLabel}&apos;s Collection
                    </dt>
                    <dd className="font-bold text-slate-900 tabular-nums">
                      {formatINR(prop.monthCollectedPaise, true)}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function OccupancyDonutCard({
  breakdown,
  periodLabel,
}: {
  breakdown: DashboardOverviewData["occupancyBreakdown"];
  periodLabel: string;
}) {
  const [mode, setMode] = useState<"units" | "beds">("units");
  const current = mode === "units" ? breakdown.units : breakdown.beds;

  const segments =
    mode === "units"
      ? [
          { label: "Occupied", value: breakdown.units.occupied, color: "#10b981" },
          { label: "Vacant", value: breakdown.units.vacant, color: "#ef6b6b" },
          { label: "Semi-Vacant", value: breakdown.units.semiVacant, color: "#f59e0b" },
        ]
      : [
          { label: "Occupied", value: breakdown.beds.occupied, color: "#10b981" },
          { label: "Vacant", value: breakdown.beds.vacant, color: "#ef6b6b" },
          { label: "Reserved", value: breakdown.beds.reserved, color: "#f59e0b" },
        ];

  const totalCount = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  const renderedSegments = segments.reduce<
    Array<{ label: string; value: number; color: string; dash: number; offset: number }>
  >((acc, seg) => {
    const prevDashSum = acc.reduce((sum, item) => sum + item.dash, 0);
    const dash = totalCount > 0 ? (seg.value / totalCount) * circumference : 0;
    acc.push({
      ...seg,
      dash,
      offset: -prevDashSum,
    });
    return acc;
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Occupancy</h2>
            <span
              title="Room & bed utilization across active properties"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500"
            >
              i
            </span>
          </div>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
            {periodLabel}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            {mode === "units" ? `Total Units : ${current.total}` : `Total Beds : ${current.total}`}
          </p>
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setMode("units")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                mode === "units" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Units
            </button>
            <button
              type="button"
              onClick={() => setMode("beds")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                mode === "beds" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Beds
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-6">
          <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
            <svg viewBox="0 0 150 150" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth="16"
              />
              {totalCount > 0 &&
                renderedSegments.map((seg) => (
                  <circle
                    key={seg.label}
                    cx="75"
                    cy="75"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="16"
                    strokeDasharray={`${seg.dash} ${circumference}`}
                    strokeDashoffset={seg.offset}
                    strokeLinecap="butt"
                  />
                ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {current.occupancyRate}%
              </span>
              <span className="text-[11px] font-medium text-slate-500 leading-tight">
                Occupancy
                <br />
                Rate
              </span>
            </div>
          </div>

          <ul className="space-y-3 text-xs sm:text-sm">
            {segments.map((seg) => (
              <li key={seg.label} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 text-slate-600">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  {seg.label}
                </span>
                <span className="font-bold text-slate-900 tabular-nums">{seg.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2.5">
        <div className="rounded-xl bg-rose-50/80 px-2.5 py-3 text-center">
          <p className="text-base font-bold text-rose-600 tabular-nums">{current.underNotice}</p>
          <p className="mt-0.5 text-[11px] font-medium text-rose-600 leading-tight">Under Notice</p>
        </div>
        <div className="rounded-xl bg-blue-50/90 px-2.5 py-3 text-center">
          <p className="text-base font-bold text-blue-700 tabular-nums">{current.underNoticeWithBooking}</p>
          <p className="mt-0.5 text-[11px] font-medium text-blue-700 leading-tight">
            Under Notice with Booking
          </p>
        </div>
        <div className="rounded-xl bg-amber-50/90 px-2.5 py-3 text-center">
          <p className="text-base font-bold text-amber-600 tabular-nums">{current.overbooked}</p>
          <p className="mt-0.5 text-[11px] font-medium text-amber-600 leading-tight">
            Overbooked occupancy
          </p>
        </div>
      </div>
    </section>
  );
}

export function FinancialsAccordionCard({
  financial,
}: {
  financial: DashboardOverviewData["financial"];
}) {
  const [timeframe, setTimeframe] = useState<"today" | "month" | "all">("today");
  const [expanded, setExpanded] = useState<string | null>(null);

  const collectionsValue =
    timeframe === "today"
      ? (financial.todayCollectedPaise ?? 0)
      : timeframe === "month"
        ? (financial.monthCollectedPaise ?? 0)
        : financial.totalCollectedPaise;

  const duesValue =
    timeframe === "today"
      ? (financial.todayDuesPaise ?? financial.outstandingBalancePaise)
      : timeframe === "month"
        ? (financial.monthOutstandingPaise ?? financial.outstandingBalancePaise)
        : financial.outstandingBalancePaise;

  const expensesValue =
    timeframe === "month"
      ? (financial.monthExpensesPaise ?? financial.totalExpensesPaise)
      : timeframe === "all"
        ? financial.totalExpensesPaise
        : (financial.monthExpensesPaise ?? 0);

  const modeBreakdown = (financial.collectionBreakdown ?? []).filter(
    (row) => row.dimension === "Mode",
  );

  const rows = [
    {
      key: "collections",
      label: "Collections",
      amount: collectionsValue,
      color: "text-emerald-600",
      iconBg: "bg-slate-100 text-slate-600",
      icon: Banknote,
      href: "/money/collection",
      details:
        modeBreakdown.length > 0
          ? modeBreakdown.map((item) => ({
              label: item.label.replaceAll("_", " "),
              value: formatINR(item.amountPaise, true),
            }))
          : [{ label: "Total confirmed collections", value: formatINR(financial.totalCollectedPaise, true) }],
    },
    {
      key: "dues",
      label: "Pending Dues",
      amount: duesValue,
      color: "text-rose-600",
      iconBg: "bg-rose-50 text-rose-500",
      icon: AlertCircle,
      href: "/money/dues",
      details: [
        { label: "Overdue dues", value: formatINR(financial.overdueDuesPaise ?? 0, true) },
        { label: "All time unpaid", value: formatINR(financial.outstandingBalancePaise, true) },
      ],
    },
    {
      key: "expenses",
      label: "Expenses",
      amount: expensesValue,
      color: "text-slate-900",
      iconBg: "bg-slate-100 text-slate-600",
      icon: Receipt,
      href: "/money/expense",
      details: [
        { label: "This month expenses", value: formatINR(financial.monthExpensesPaise ?? 0, true) },
        { label: "All time expenses", value: formatINR(financial.totalExpensesPaise, true) },
      ],
    },
    {
      key: "deposit",
      label: "Available Deposit",
      amount: financial.securityDepositsHeldPaise,
      color: "text-slate-900",
      iconBg: "bg-slate-100 text-slate-600",
      icon: Wallet,
      href: "/money",
      details: [
        { label: "Held security deposits", value: formatINR(financial.securityDepositsHeldPaise, true) },
        { label: "Pending deposits", value: formatINR(financial.pendingDepositsPaise ?? 0, true) },
      ],
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Financials</h2>
          <span
            title="Live financial summary across your properties"
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500"
          >
            i
          </span>
        </div>
        <select
          aria-label="Financials timeframe"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as "today" | "month" | "all")}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="today">Today</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="divide-y divide-slate-100">
        {rows.map((row) => {
          const Icon = row.icon;
          const isOpen = expanded === row.key;
          return (
            <div key={row.key} className="py-3.5 first:pt-1 last:pb-1">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : row.key)}
                className="flex w-full items-center justify-between gap-3 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${row.iconBg}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-slate-500">{row.label}</p>
                    <p className={`mt-0.5 text-base font-bold tabular-nums ${row.color}`}>
                      {formatINR(row.amount, true)}
                    </p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
                )}
              </button>

              {isOpen && (
                <div className="mt-3 ml-12 rounded-xl bg-slate-50 p-3 space-y-2 text-xs">
                  {row.details.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-slate-600">
                      <span>{item.label}</span>
                      <span className="font-semibold text-slate-900 tabular-nums">{item.value}</span>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-slate-200/70">
                    <Link href={row.href} className="font-semibold text-blue-600 hover:underline">
                      Open {row.label.toLowerCase()} ledger →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function JourneyCard({
  journey,
  periodLabel,
}: {
  journey: DashboardOverviewData["journey"];
  periodLabel: string;
}) {
  const [tab, setTab] = useState<"leads" | "bookings" | "tenants">("tenants");

  const config =
    tab === "tenants"
      ? {
          totalLabel: `Total Tenants: ${journey.tenants.total}`,
          max: Math.max(
            1,
            journey.tenants.total,
            journey.tenants.active,
            journey.tenants.noticeRaised,
            journey.tenants.renewalsDue,
          ),
          bars: [
            { label: "Active", count: journey.tenants.active },
            { label: "Notice Raised", count: journey.tenants.noticeRaised },
            { label: "Confirmed Eviction", count: journey.tenants.confirmedEviction },
            { label: "Renewals Due", count: journey.tenants.renewalsDue },
          ],
        }
      : tab === "leads"
        ? {
            totalLabel: `Total Leads: ${journey.leads.total}`,
            max: Math.max(1, journey.leads.total),
            bars: [
              { label: "New", count: journey.leads.newCount },
              { label: "Contacted", count: journey.leads.contacted },
              { label: "Visited", count: journey.leads.visited },
              { label: "Token Paid", count: journey.leads.tokenPaid },
              { label: "Converted", count: journey.leads.converted },
            ],
          }
        : {
            totalLabel: `Total Bookings: ${journey.bookings.total}`,
            max: Math.max(1, journey.bookings.total),
            bars: [
              { label: "Confirmed", count: journey.bookings.confirmed },
              { label: "Checked In", count: journey.bookings.checkedIn },
              { label: "Cancelled", count: journey.bookings.cancelled },
              { label: "Expired", count: journey.bookings.expired },
            ],
          };

  const ticks = Array.from({ length: 5 }, (_, i) => Math.round((config.max / 5) * (i + 1)));

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Journey</h2>
            <span
              title="Funnel progression across Leads, Bookings, and Tenants"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500"
            >
              i
            </span>
          </div>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
            {periodLabel}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 rounded-xl bg-slate-100/80 p-1">
          {(["leads", "bookings", "tenants"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-lg py-1.5 text-xs font-semibold capitalize transition cursor-pointer ${
                tab === item
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>{config.totalLabel}</span>
          <div className="hidden sm:flex items-center gap-6 text-[11px] text-slate-500 tabular-nums">
            {ticks.map((t, idx) => (
              <span key={idx}>{t}</span>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3.5">
          {config.bars.map((bar) => {
            const widthPct = bar.count > 0 ? Math.max(8, Math.round((bar.count / config.max) * 100)) : 0;
            return (
              <div key={bar.label} className="grid grid-cols-[96px_1fr] items-center gap-3">
                <span className="text-xs font-medium text-slate-600 leading-tight">{bar.label}</span>
                <div className="relative h-9 w-full overflow-hidden rounded-lg bg-blue-50">
                  {widthPct > 0 && (
                    <div
                      className="flex h-full items-center justify-end rounded-lg bg-blue-500 px-2.5 text-xs font-bold text-white transition-all duration-300 tabular-nums"
                      style={{ width: `${widthPct}%` }}
                    >
                      {bar.count}
                    </div>
                  )}
                  {widthPct === 0 && (
                    <span className="flex h-full items-center px-3 text-xs font-medium text-slate-400">
                      0
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function IssuesAndReportsRow({
  issuesOverview,
  periodLabel,
}: {
  issuesOverview: DashboardOverviewData["issuesOverview"];
  periodLabel: string;
}) {
  const [issueTab, setIssueTab] = useState<"byCategory" | "byStatus" | "byAssignee">("byCategory");
  const items = issuesOverview[issueTab];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {/* Issues Overview */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Issues Overview</h2>
            <span
              title="Active complaints breakdown"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500"
            >
              i
            </span>
          </div>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
            {periodLabel}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 rounded-xl bg-slate-100/80 p-1">
          {[
            { key: "byCategory", label: "Categories" },
            { key: "byStatus", label: "Status" },
            { key: "byAssignee", label: "Assignee" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setIssueTab(tab.key as "byCategory" | "byStatus" | "byAssignee")}
              className={`rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                issueTab === tab.key
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="mt-2.5 text-xs font-medium text-slate-500">
              No active complaints in this view
            </p>
            <Link href="/property/complaints" className="mt-2 text-xs font-semibold text-blue-600 hover:underline">
              Open complaints board →
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {items.slice(0, 5).map((entry) => (
              <li key={entry.label} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-slate-700 capitalize">
                  {entry.label.toLowerCase()}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-900 tabular-nums">
                  {entry.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Upcoming Reports */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Upcoming Reports</h2>
            <Link href="/reports" className="text-xs font-semibold text-blue-600 hover:underline">
              All Reports →
            </Link>
          </div>
          <div className="mt-6 flex flex-col items-center justify-center text-center py-4">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <FileText className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs sm:text-sm text-slate-600 max-w-xs">
              Export live CSV reports for dues, collections, expenses, and resident directories anytime.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                href="/reports"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-950 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-900 transition"
              >
                <span>Open Reports Center</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function TrustFooterBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white pt-8 sm:pt-12 shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 sm:px-10 pb-6 items-center">
        <div className="text-center lg:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Trusted by
          </p>
          <p className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-400">
            10,000+
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Active Property Managers
          </p>
        </div>

        <div className="flex flex-col items-center lg:items-end text-center lg:text-right gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Join across India</p>
            <p className="text-sm font-semibold text-slate-700">20,000+ PGs &amp; Hostels</p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-700">
            <span>Made with</span>
            <span className="text-rose-500" aria-hidden="true">♥</span>
            <span>in India</span>
          </div>
          <p className="text-xs text-slate-400">PgInfo Property Management Platform</p>
        </div>
      </div>

      {/* Subtle architectural PG skyline illustration */}
      <svg
        viewBox="0 0 1200 130"
        className="w-full h-20 sm:h-28 text-slate-300"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="60" y="38" width="90" height="92" />
          <rect x="75" y="52" width="16" height="18" />
          <rect x="102" y="52" width="16" height="18" />
          <rect x="75" y="80" width="16" height="18" />
          <rect x="102" y="80" width="16" height="18" />
          <rect x="160" y="18" width="120" height="112" />
          <rect x="178" y="34" width="20" height="20" />
          <rect x="210" y="34" width="20" height="20" />
          <rect x="242" y="34" width="20" height="20" />
          <rect x="178" y="64" width="20" height="20" />
          <rect x="210" y="64" width="20" height="20" />
          <rect x="242" y="64" width="20" height="20" />
          <rect x="315" y="42" width="150" height="88" />
          <rect x="355" y="18" width="46" height="24" />
          <text x="366" y="35" fill="currentColor" fontSize="14" fontWeight="700" stroke="none">
            PG
          </text>
          <rect x="335" y="58" width="24" height="22" />
          <rect x="372" y="58" width="24" height="22" />
          <rect x="409" y="58" width="24" height="22" />
          <path d="M510 130 V78 L555 52 L600 78 V130" />
          <rect x="542" y="88" width="26" height="42" />
          <path d="M625 130 V72 L680 46 L735 72 V130" />
          <rect x="665" y="85" width="30" height="45" />
          <rect x="770" y="32" width="110" height="98" />
          <rect x="790" y="48" width="22" height="20" />
          <rect x="830" y="48" width="22" height="20" />
          <rect x="790" y="78" width="22" height="20" />
          <rect x="830" y="78" width="22" height="20" />
          <rect x="910" y="54" width="130" height="76" />
          <rect x="935" y="70" width="22" height="20" />
          <rect x="975" y="70" width="22" height="20" />
          <path d="M1070 130 V66 L1120 42 L1170 66 V130" />
          <line x1="0" y1="129" x2="1200" y2="129" />
        </g>
      </svg>
    </section>
  );
}

export {
  BedDouble,
  Building2,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
};
