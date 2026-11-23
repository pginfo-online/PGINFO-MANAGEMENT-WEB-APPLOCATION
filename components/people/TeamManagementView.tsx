"use client";

import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserRoundPlus } from "lucide-react";
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
  const [editing, setEditing] = useState<StaffMember>();
  const [pagination, setPagination] = useState({ scope: "", page: 1 });
  const term = useDeferredValue(search.trim());
  const scope = JSON.stringify([selectedPropertyId, term]);
  const page = pagination.scope === scope ? pagination.page : 1;
  const staff = useQuery({
    queryKey: ["staff", selectedPropertyId, term, page],
    queryFn: () => api.staff.list({ propertyId: selectedPropertyId ?? undefined, search: term, page, limit: 24 }),
  });
  const deactivate = useMutation({
    mutationFn: api.staff.delete,
    onSuccess() {
      void client.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member deactivated");
    },
    onError(error) { toast.error(error.message); },
  });
  return (
    <>
      <PageHeading title="Team" description="Manage staff records and property assignments." action={<button className="workspace-button primary" onClick={() => openAdd(true)}><UserRoundPlus className="size-4" /> Add staff</button>} />
      <OrganizationAccess />
      <label className="workspace-search mb-5 max-w-sm"><Search className="size-4" /><input aria-label="Search staff" placeholder="Search by name or phone" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      {staff.isPending && <Skeleton layout="cards" />}
      {staff.error && <QueryError error={staff.error} retry={() => void staff.refetch()} />}
      {staff.isSuccess && !staff.data.data.length && <p className="workspace-card p-6 text-sm text-slate-600">No staff in this view.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {staff.data?.data.map((member: StaffMember) => (
          <article className="workspace-card p-5" key={member.id}>
            <div className="flex items-start justify-between gap-2"><div><h2 className="text-lg font-semibold">{[member.firstName, member.lastName].filter(Boolean).join(" ")}</h2><p className="mt-1 text-sm text-slate-600">{[member.designation?.name, member.property?.name].filter(Boolean).join(" · ")}</p></div><span className="workspace-tag">{member.status.replaceAll("_", " ")}</span></div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <a className="underline underline-offset-2" href={`tel:${member.mobile}`}>{member.mobile}</a>
              {member.salary != null && <span>{formatINR(member.salary)} / month</span>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <button className="workspace-button" onClick={() => setEditing(member)}>Edit staff</button>
              {member.status === "ACTIVE" && <button className="workspace-button" disabled={deactivate.isPending} onClick={() => { if (confirm(`Deactivate ${member.firstName}?`)) deactivate.mutate(member.id); }}>Deactivate</button>}
            </div>
          </article>
        ))}
      </div>
      {(page > 1 || staff.data?.meta.hasMore) && <div className="mt-5 flex justify-end gap-2"><button className="workspace-button" disabled={page === 1} onClick={() => setPagination({ scope, page: page - 1 })}>Previous</button><button className="workspace-button" disabled={!staff.data?.meta.hasMore} onClick={() => setPagination({ scope, page: page + 1 })}>Next</button></div>}
      {editing && <AddStaffModal key={editing.id} staff={editing} onClose={() => setEditing(undefined)} />}
    </>
  );
}
