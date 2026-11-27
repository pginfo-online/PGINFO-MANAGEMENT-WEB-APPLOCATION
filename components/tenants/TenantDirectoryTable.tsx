"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  ArrowUpRight,
  ExternalLink,
  FileWarning,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api, authStorage } from "@/lib/api/client";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { formatDate, formatINR } from "@/lib/utils";
import BalanceActions from "../money/BalanceActions";
import { PageHeading, QueryError, Skeleton } from "../layout/WorkspaceUI";

const statuses = [
  ["", "Tenant Status"],
  ["ACTIVE", "Active"],
  ["NOTICE_PERIOD", "On notice"],
  ["PENDING_MOVE_IN", "Expected"],
  ["MOVED_OUT", "Moved out"],
  ["ARCHIVED", "Archived"],
];

type SortColumn = "name" | "room" | "rent" | "checkOutDate" | "dues" | "status";

export default function TenantDirectoryTable({ former = false }: { former?: boolean }) {
  const searchParams = useSearchParams();
  const initialKyc = !former && searchParams.get("kyc") === "PENDING" ? "PENDING" : "ALL";

  const { selectedPropertyId, activePropertyName } = usePropertyStore();
  const { setSelectedTenantForDue, setAnnouncementsOpen } = useUiStore();
  const [balanceId, setBalanceId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(former ? "MOVED_OUT" : "");
  const [kycStatus, setKycStatus] = useState(initialKyc);
  const [evictionStatus, setEvictionStatus] = useState("ALL");
  const [moveInPreset, setMoveInPreset] = useState("ALL");
  const [createdAtPreset, setCreatedAtPreset] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortColumn | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pagination, setPagination] = useState({ scope: "", page: 1 });
  const term = useDeferredValue(search.trim());

  const scope = JSON.stringify([
    selectedPropertyId,
    term,
    status,
    kycStatus,
    evictionStatus,
    moveInPreset,
    createdAtPreset,
    sortBy,
    sortOrder,
  ]);
  const page = pagination.scope === scope ? pagination.page : 1;
  const selectionScope = JSON.stringify([scope, page]);
  const [selection, setSelection] = useState<{ scope: string; ids: string[] }>({
    scope: "",
    ids: [],
  });
  const [confirmation, setConfirmation] = useState<string[]>();
  const selected = selection.scope === selectionScope ? selection.ids : [];

  function select(id: string, checked: boolean) {
    setSelection({
      scope: selectionScope,
      ids: checked ? [...selected, id] : selected.filter((item) => item !== id),
    });
  }

  const residents = useQuery({
    queryKey: [
      "residents",
      selectedPropertyId,
      term,
      status,
      kycStatus,
      evictionStatus,
      moveInPreset,
      createdAtPreset,
      sortBy,
      sortOrder,
      page,
    ],
    queryFn: () =>
      api.residents.list({
        propertyId: selectedPropertyId ?? undefined,
        search: term,
        status,
        kycStatus: kycStatus !== "ALL" ? kycStatus : undefined,
        evictionStatus: evictionStatus !== "ALL" ? evictionStatus : undefined,
        moveInPreset: moveInPreset !== "ALL" ? moveInPreset : undefined,
        createdAtPreset: createdAtPreset !== "ALL" ? createdAtPreset : undefined,
        sortBy,
        sortOrder: sortBy ? sortOrder : undefined,
        page,
        limit: 24,
      }),
  });

  const rows = residents.data?.data ?? [];
  const selectableIds = rows
    .filter((t) => !former && ["ACTIVE", "NOTICE_PERIOD"].includes(t.status))
    .map((t) => t.id as string);
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.includes(id));

  const toggleSelectAll = (checked: boolean) => {
    setSelection({
      scope: selectionScope,
      ids: checked ? selectableIds : [],
    });
  };

  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatus(former ? "MOVED_OUT" : "");
    setKycStatus("ALL");
    setEvictionStatus("ALL");
    setMoveInPreset("ALL");
    setCreatedAtPreset("ALL");
    setSortBy(undefined);
    setSortOrder("asc");
  };

  const canRemind = ["OWNER", "ADMIN", "MANAGER"].includes(
    authStorage.getUser()?.activeOrganizationRole ?? "",
  );

  const reminders = useMutation({
    mutationFn: (kind: "rent" | "autopay") =>
      api.announcements.sendRentReminders({
        kind,
        channel: "WHATSAPP",
        propertyId: selectedPropertyId ?? undefined,
        residentIds: selected.length ? selected : undefined,
      }),
    onSuccess: (result) =>
      toast.info(`${result.remindersSent} reminders accepted · ${result.failedCount} failures`),
    onError: (error) => toast.error(error.message),
  });

  const report = useMutation({
    mutationFn: () =>
      api.reports.download("residents", { propertyId: selectedPropertyId ?? undefined }),
    onSuccess(csv) {
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "residents.csv";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    onError: (error) => toast.error(error.message),
  });

  function sendReminder(kind: "rent" | "autopay") {
    const scopeLabel = selected.length ? `${selected.length} selected tenants` : activePropertyName;
    if (
      confirm(
        `Send ${kind === "autopay" ? "autopay" : "rent payment"} reminders for ${scopeLabel}?`,
      )
    ) {
      reminders.mutate(kind);
    }
  }

  const getTenantStatusBadge = (tenant: any) => {
    if (!former && !tenant.idProofUrl) {
      return {
        label: "Document Not Uploaded",
        tone: "bg-slate-100 text-slate-700 border-slate-200",
      };
    }
    if (!former && !tenant.agreementUrl) {
      return {
        label: "Agreement Pending",
        tone: "bg-amber-50 text-amber-800 border-amber-200",
      };
    }
    if (tenant.status === "NOTICE_PERIOD") {
      return {
        label: "On Notice",
        tone: "bg-orange-50 text-orange-700 border-orange-200",
      };
    }
    if (tenant.status === "PENDING_MOVE_IN") {
      return {
        label: "Expected",
        tone: "bg-blue-50 text-blue-700 border-blue-200",
      };
    }
    if (tenant.status === "MOVED_OUT") {
      return {
        label: "Moved Out",
        tone: "bg-slate-100 text-slate-700 border-slate-200",
      };
    }
    return {
      label: statuses.find(([value]) => value === tenant.status)?.[1] ?? tenant.status,
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  };

  const hasActiveFilters =
    Boolean(search) ||
    (former ? status !== "MOVED_OUT" : Boolean(status)) ||
    kycStatus !== "ALL" ||
    evictionStatus !== "ALL" ||
    moveInPreset !== "ALL" ||
    createdAtPreset !== "ALL";

  return (
    <>
      <PageHeading
        title={former ? "Former tenants" : "Tenants"}
        description={
          former
            ? "Review moved-out and archived resident records."
            : `Manage residents and their stays across ${selectedPropertyId ? activePropertyName : "all properties"}.`
        }
        action={
          former ? undefined : (
            <div className="flex flex-wrap gap-2">
              <button className="workspace-button" onClick={() => setAnnouncementsOpen(true)}>
                <Send className="size-4" /> Announcements
              </button>
              <Link href="/people/tenants/addTenant" className="workspace-button primary">
                <Plus className="size-4" /> Add tenant
              </Link>
            </div>
          )
        }
      />

      {!former && canRemind && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            className="workspace-button"
            disabled={reminders.isPending}
            onClick={() => sendReminder("rent")}
          >
            WhatsApp rent reminders
          </button>
          <button
            className="workspace-button"
            disabled={reminders.isPending}
            onClick={() => sendReminder("autopay")}
          >
            Autopay reminders
          </button>
          <button
            className="workspace-button"
            disabled={report.isPending}
            onClick={() => report.mutate()}
          >
            Download tenant CSV
          </button>
        </div>
      )}

      {/* Search & Filter Row matching ref-5 */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-base font-bold text-slate-900 tabular-nums">
              {residents.data ? `${residents.data.meta.total} Results` : "Tenants"}
            </span>
            <label className="workspace-search min-w-[220px] sm:w-72">
              <Search className="size-4" />
              <input
                aria-label="Search tenants"
                placeholder="Search by name or phone"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                maxLength={120}
              />
            </label>
            {selected.length > 0 && (
              <button
                className="workspace-button primary"
                onClick={() => setConfirmation(selected)}
              >
                Move out selected ({selected.length})
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!former && (
              <>
                <select
                  aria-label="KYC status"
                  value={kycStatus}
                  onChange={(e) => setKycStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 cursor-pointer"
                >
                  <option value="ALL">KYC Status</option>
                  <option value="UPLOADED">KYC Uploaded</option>
                  <option value="PENDING">KYC Pending</option>
                </select>

                <select
                  aria-label="Move in date"
                  value={moveInPreset}
                  onChange={(e) => setMoveInPreset(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 cursor-pointer"
                >
                  <option value="ALL">Move In Date</option>
                  <option value="LAST_7_DAYS">Last 7 Days</option>
                  <option value="LAST_30_DAYS">Last 30 Days</option>
                  <option value="THIS_MONTH">This Month</option>
                </select>

                <select
                  aria-label="Created at"
                  value={createdAtPreset}
                  onChange={(e) => setCreatedAtPreset(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 cursor-pointer"
                >
                  <option value="ALL">Created At</option>
                  <option value="LAST_7_DAYS">Last 7 Days</option>
                  <option value="LAST_30_DAYS">Last 30 Days</option>
                  <option value="THIS_MONTH">This Month</option>
                </select>
              </>
            )}

            <select
              aria-label="Tenant status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 cursor-pointer"
            >
              {(former ? statuses.slice(-2) : statuses).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>

            {!former && (
              <select
                aria-label="Eviction status"
                value={evictionStatus}
                onChange={(e) => setEvictionStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 cursor-pointer"
              >
                <option value="ALL">Eviction Status</option>
                <option value="ON_NOTICE">On Notice</option>
                <option value="ACTIVE_STAY">Active Stay</option>
              </select>
            )}

            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters && !sortBy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>

      {residents.isPending && <Skeleton layout="cards" count={6} />}
      {residents.error && (
        <QueryError error={residents.error} retry={() => void residents.refetch()} />
      )}
      {residents.isSuccess && !rows.length && (
        <p className="workspace-card p-8 text-sm text-slate-600">
          {hasActiveFilters
            ? "No tenants match these filters."
            : "Add a tenant to start managing stays."}
        </p>
      )}

      {/* Desktop Table View (lg and up) matching ref-5.png */}
      {rows.length > 0 && (
        <div className="hidden lg:block rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                  {!former && (
                    <th className="py-3.5 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        className="size-4 accent-emerald-800 rounded"
                        aria-label="Select all tenants on this page"
                        checked={allSelected}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                      />
                    </th>
                  )}
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort("name")}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      <span>NAME</span>
                      <ArrowUpDown className="h-3 w-3 opacity-70" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort("room")}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      <span>ROOM</span>
                      <ArrowUpDown className="h-3 w-3 opacity-70" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort("rent")}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      <span>RENT</span>
                      <ArrowUpDown className="h-3 w-3 opacity-70" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort("checkOutDate")}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      <span>CHECK OUT DATE</span>
                      <ArrowUpDown className="h-3 w-3 opacity-70" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort("dues")}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      <span>DUES</span>
                      <ArrowUpDown className="h-3 w-3 opacity-70" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort("status")}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      <span>STATUS</span>
                      <ArrowUpDown className="h-3 w-3 opacity-70" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {rows.map((tenant) => {
                  const name = [tenant.firstName, tenant.lastName].filter(Boolean).join(" ");
                  const roomLabel = tenant.room?.roomNumber
                    ? `${tenant.room.roomNumber}${tenant.bed?.bedNumber ? ` Bed ${tenant.bed.bedNumber}` : ""}`
                    : "Unassigned";
                  const checkOutDate = former
                    ? tenant.moveOutDate
                    : tenant.expectedVacatingDate;
                  const statusBadge = getTenantStatusBadge(tenant);
                  const duesPaise = typeof tenant.dues === "number" ? tenant.dues : 0;

                  return (
                    <tr key={tenant.id} className="hover:bg-slate-50/70 transition">
                      {!former && (
                        <td className="py-3.5 pl-4 pr-2">
                          {["ACTIVE", "NOTICE_PERIOD"].includes(tenant.status) && (
                            <input
                              type="checkbox"
                              className="size-4 accent-emerald-800 rounded"
                              aria-label={`Select ${name} for move-out`}
                              checked={selected.includes(tenant.id)}
                              onChange={(event) => select(tenant.id, event.target.checked)}
                            />
                          )}
                        </td>
                      )}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/people/tenants/${tenant.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                            {(tenant.firstName?.[0] ?? "T").toUpperCase()}
                            {(tenant.lastName?.[0] ?? "").toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <span className="block font-semibold text-slate-900 group-hover:text-blue-700 truncate">
                              {name}
                            </span>
                            {tenant.property?.name && (
                              <span className="block text-xs text-slate-500 truncate">
                                {tenant.property.name}
                              </span>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {roomLabel}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {tenant.monthlyRent != null ? formatINR(tenant.monthlyRent) : "₹0"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        {checkOutDate ? formatDate(checkOutDate) : "-"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link
                          href={`/people/tenants/${tenant.id}`}
                          className={`inline-flex items-center gap-1 font-semibold tabular-nums hover:underline ${
                            duesPaise > 0 ? "text-rose-600" : "text-slate-700"
                          }`}
                        >
                          <span>{formatINR(duesPaise)}</span>
                          <ExternalLink className="h-3.5 w-3.5 opacity-75" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${statusBadge.tone}`}
                        >
                          {!former && !tenant.idProofUrl && (
                            <FileWarning className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span>{statusBadge.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          {["ACTIVE", "NOTICE_PERIOD"].includes(tenant.status) && (
                            <button
                              type="button"
                              onClick={() => setSelectedTenantForDue(tenant)}
                              className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Dues</span>
                            </button>
                          )}
                          {tenant.mobile && (
                            <a
                              href={`tel:${tenant.mobile}`}
                              title={`Call ${name}`}
                              aria-label={`Call ${name}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 transition"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {!former && tenant.mobile && (
                            <button
                              type="button"
                              onClick={() => setBalanceId(tenant.id)}
                              title={`WhatsApp & Balance actions for ${name}`}
                              aria-label={`WhatsApp actions for ${name}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition cursor-pointer"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {former && (
                            <Link
                              href={`/people/tenants/${tenant.id}`}
                              className="workspace-button"
                            >
                              Profile <ArrowUpRight className="size-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile & Tablet Card View (< lg) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
        {rows.map((tenant) => {
          const name = [tenant.firstName, tenant.lastName].filter(Boolean).join(" ");
          const statusBadge = getTenantStatusBadge(tenant);
          return (
            <article className="workspace-card p-5" key={tenant.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="workspace-icon-tile font-semibold">
                  {tenant.firstName?.[0]}
                  {tenant.lastName?.[0]}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge.tone}`}>
                    {statusBadge.label}
                  </span>
                  {!former && ["ACTIVE", "NOTICE_PERIOD"].includes(tenant.status) && (
                    <input
                      type="checkbox"
                      className="size-4 accent-emerald-800"
                      aria-label={`Select ${name} for move-out`}
                      checked={selected.includes(tenant.id)}
                      onChange={(event) => select(tenant.id, event.target.checked)}
                    />
                  )}
                </div>
              </div>
              <h2 className="mt-4 text-lg font-semibold">{name}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {[
                  tenant.property?.name,
                  tenant.room?.roomNumber ? `Room ${tenant.room.roomNumber}` : null,
                  tenant.bed?.bedNumber ? `Bed ${tenant.bed.bedNumber}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Room unassigned"}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                {tenant.mobile && (
                  <a
                    href={`tel:${tenant.mobile}`}
                    className="underline decoration-slate-300 underline-offset-2"
                  >
                    {tenant.mobile}
                  </a>
                )}
                {tenant.monthlyRent != null && <span>{formatINR(tenant.monthlyRent)} / month</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {typeof tenant.dues === "number" && (
                  <span className={tenant.isOverdue || tenant.dues > 0 ? "text-rose-700 font-semibold" : "text-slate-600"}>
                    Dues {formatINR(tenant.dues)}
                  </span>
                )}
                {typeof tenant.autopayActive === "boolean" && (
                  <span className="workspace-tag">
                    {tenant.autopayActive ? "Autopay active" : "Autopay inactive"}
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <Link href={`/people/tenants/${tenant.id}`} className="workspace-button">
                  View profile <ArrowUpRight className="size-4" />
                </Link>
                {!former && tenant.mobile && (
                  <button className="workspace-button" onClick={() => setBalanceId(tenant.id)}>
                    WhatsApp
                  </button>
                )}
                {["ACTIVE", "NOTICE_PERIOD"].includes(tenant.status) && (
                  <button
                    className="workspace-button"
                    onClick={() => setSelectedTenantForDue(tenant)}
                  >
                    Add due
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {(page > 1 || residents.data?.meta.hasMore) && (
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="workspace-button"
            disabled={page === 1}
            onClick={() => setPagination({ scope, page: page - 1 })}
          >
            Previous
          </button>
          <button
            className="workspace-button"
            disabled={!residents.data?.meta.hasMore}
            onClick={() => setPagination({ scope, page: page + 1 })}
          >
            Next
          </button>
        </div>
      )}

      {balanceId && <BalanceActions id={balanceId} close={() => setBalanceId("")} />}
      {confirmation && (
        <BulkMoveOut
          ids={confirmation}
          close={(saved) => {
            setConfirmation(undefined);
            if (saved) setSelection({ scope: selectionScope, ids: [] });
          }}
        />
      )}
    </>
  );
}

function BulkMoveOut({ ids, close }: { ids: string[]; close: (saved: boolean) => void }) {
  const client = useQueryClient();
  const moveOut = useMutation({
    mutationFn: api.residents.bulkMoveOut,
    onSuccess() {
      for (const key of [
        "resident",
        "residents",
        "rooms",
        "inventoryStats",
        "dashboardMetrics",
        "money",
      ]) {
        void client.invalidateQueries({ queryKey: [key] });
      }
      toast.success(ids.length === 1 ? "Move-out recorded" : "Move-outs recorded");
      close(true);
    },
  });
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !moveOut.isPending) close(false);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="workspace-overlay" />
        <Dialog.Content className="workspace-dialog">
          <div className="flex justify-between gap-3">
            <div>
              <Dialog.Title className="text-xl font-semibold">
                Move out selected tenants
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-600">
                This closes {ids.length} {ids.length === 1 ? "stay" : "stays"} and releases the
                assigned beds.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="workspace-icon"
              aria-label="Close move-out form"
              disabled={moveOut.isPending}
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <form
            className="workspace-form mt-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (moveOut.isPending) return;
              const fields = new FormData(event.currentTarget);
              moveOut.mutate({
                residentIds: ids,
                moveOutDate: String(fields.get("date")),
                notes: String(fields.get("notes")).trim() || undefined,
                archive: fields.has("archive"),
              });
            }}
          >
            <fieldset className="space-y-4" disabled={moveOut.isPending}>
              <label>
                Move-out date
                <input name="date" type="date" required />
              </label>
              <label>
                Notes (optional)
                <textarea name="notes" rows={2} maxLength={1000} />
              </label>
              <label style={{ display: "flex", alignItems: "center" }}>
                <input className="max-w-4 accent-emerald-800" name="archive" type="checkbox" />{" "}
                Archive records after move-out
              </label>
            </fieldset>
            {moveOut.error && (
              <p role="alert" className="mt-4 text-sm text-rose-700">
                {moveOut.error.message}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close className="workspace-button" disabled={moveOut.isPending}>
                Cancel
              </Dialog.Close>
              <button className="workspace-button primary" disabled={moveOut.isPending}>
                {moveOut.isPending ? "Saving…" : "Confirm move-out"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
