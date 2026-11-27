"use client";

import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Phone, Search, UserRoundPlus, UserX } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { formatINR } from "@/lib/utils";
import OrganizationAccess from "./OrganizationAccess";
import AddStaffModal from "../drawers/AddStaffModal";
import { PageHeading, QueryError, Skeleton } from "../layout/WorkspaceUI";

interface StaffMember {
  id: string;
  firstName: string;
  lastName?: string;
  mobile: string;
  email?: string;
  salary?: number;
  designationId: string;
  designation?: { name: string };
  property?: { name: string };
  status: string;
}

export default function TeamManagementView() {
  const selectedPropertyId = usePropertyStore((state) => state.selectedPropertyId);
  const openAdd = useUiStore((state) => state.setAddStaffOpen);
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState<StaffMember>();
  const [pagination, setPagination] = useState({ scope: "", page: 1 });
  const term = useDeferredValue(search.trim());
  const scope = JSON.stringify([selectedPropertyId, term, statusFilter]);
  const page = pagination.scope === scope ? pagination.page : 1;

  const staff = useQuery({
    queryKey: ["staff", selectedPropertyId, term, statusFilter, page],
    queryFn: () =>
      api.staff.list({
        propertyId: selectedPropertyId ?? undefined,
        search: term,
        status: statusFilter || undefined,
        page,
        limit: 24,
      }),
  });

  const deactivate = useMutation({
    mutationFn: api.staff.delete,
    onSuccess() {
      void client.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member deactivated");
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const rows: StaffMember[] = staff.data?.data ?? [];

  return (
    <>
      <PageHeading
        title="Team"
        description="Manage staff records and property assignments."
        action={
          <button className="workspace-button primary" onClick={() => openAdd(true)}>
            <UserRoundPlus className="size-4" /> Add staff
          </button>
        }
      />
      <OrganizationAccess />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="workspace-search max-w-sm">
          <Search className="size-4" />
          <input
            aria-label="Search staff"
            placeholder="Search by name or phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Staff status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="workspace-button"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        {staff.data && (
          <span className="ml-auto text-sm text-slate-600">{staff.data.meta.total} staff</span>
        )}
      </div>

      {staff.isPending && <Skeleton layout="cards" />}
      {staff.error && <QueryError error={staff.error} retry={() => void staff.refetch()} />}
      {staff.isSuccess && !rows.length && (
        <p className="workspace-card p-6 text-sm text-slate-600">No staff in this view.</p>
      )}

      {/* Desktop Table View */}
      {rows.length > 0 && (
        <div className="hidden lg:block rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">STAFF MEMBER</th>
                  <th className="py-3.5 px-5">DESIGNATION</th>
                  <th className="py-3.5 px-5">PROPERTY</th>
                  <th className="py-3.5 px-5">MOBILE</th>
                  <th className="py-3.5 px-5">SALARY</th>
                  <th className="py-3.5 px-5">STATUS</th>
                  <th className="py-3.5 px-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {rows.map((member) => {
                  const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5 font-semibold text-slate-900">
                        <div>
                          <span>{fullName}</span>
                          {member.email && (
                            <span className="block text-xs font-normal text-slate-500">
                              {member.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-700">
                        {member.designation?.name || "—"}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {member.property?.name || "All Properties"}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <a
                          href={`tel:${member.mobile}`}
                          className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-700"
                        >
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{member.mobile}</span>
                        </a>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                        {member.salary != null ? `${formatINR(member.salary)} / mo` : "—"}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            member.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {member.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditing(member)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          {member.status === "ACTIVE" && (
                            <button
                              type="button"
                              disabled={deactivate.isPending}
                              onClick={() => {
                                if (confirm(`Deactivate ${member.firstName}?`)) {
                                  deactivate.mutate(member.id);
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer disabled:opacity-50"
                            >
                              <UserX className="h-3.5 w-3.5" />
                              <span>Deactivate</span>
                            </button>
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

      {/* Mobile Card View */}
      <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
        {rows.map((member: StaffMember) => (
          <article className="workspace-card p-5" key={member.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">
                  {[member.firstName, member.lastName].filter(Boolean).join(" ")}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {[member.designation?.name, member.property?.name].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="workspace-tag">{member.status.replaceAll("_", " ")}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <a className="underline underline-offset-2" href={`tel:${member.mobile}`}>
                {member.mobile}
              </a>
              {member.salary != null && <span>{formatINR(member.salary)} / month</span>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <button className="workspace-button" onClick={() => setEditing(member)}>
                Edit staff
              </button>
              {member.status === "ACTIVE" && (
                <button
                  className="workspace-button"
                  disabled={deactivate.isPending}
                  onClick={() => {
                    if (confirm(`Deactivate ${member.firstName}?`)) deactivate.mutate(member.id);
                  }}
                >
                  Deactivate
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {(page > 1 || staff.data?.meta.hasMore) && (
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
            disabled={!staff.data?.meta.hasMore}
            onClick={() => setPagination({ scope, page: page + 1 })}
          >
            Next
          </button>
        </div>
      )}
      {editing && (
        <AddStaffModal key={editing.id} staff={editing} onClose={() => setEditing(undefined)} />
      )}
    </>
  );
}
