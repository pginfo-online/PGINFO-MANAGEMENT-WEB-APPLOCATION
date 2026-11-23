"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, authStorage, type MemberRole } from "@/lib/api/client";
import { QueryError, Skeleton } from "../layout/WorkspaceUI";

const roles: MemberRole[] = ["ADMIN", "MANAGER", "STAFF", "VIEWER"];

export default function OrganizationAccess() {
  const orgId = authStorage.getOrgId();
  const user = authStorage.getUser();
  const canManage = user?.activeOrganizationRole === "OWNER" || user?.activeOrganizationRole === "ADMIN";
  const client = useQueryClient();
  const key = ["organizations", orgId, "members"] as const;
  const members = useQuery({ queryKey: key, enabled: !!orgId, queryFn: () => api.members.list(orgId!) });
  const update = useMutation({
    mutationFn: (change: { email: string; role: MemberRole } | { id: string; role?: MemberRole }) => {
      if ("email" in change) return api.members.add(orgId!, change.email, change.role);
      if (change.role) return api.members.update(orgId!, change.id, change.role);
      return api.members.remove(orgId!, change.id);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
  if (!orgId) return null;
  return (
    <section className="workspace-card mb-6 space-y-4 p-5">
      <h2 className="text-lg font-semibold">Organization access</h2>
      {canManage && <form className="workspace-form flex flex-wrap items-end gap-3" onSubmit={(event) => {
        event.preventDefault();
        if (update.isPending) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        update.mutate({ email: String(data.get("email")).trim().toLowerCase(), role: data.get("role") as MemberRole }, { onSuccess: () => form.reset() });
      }}>
        <label>Registered email<input type="email" name="email" required /></label>
        <label>Role<select name="role" defaultValue="VIEWER">{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
        <button className="workspace-button primary" disabled={update.isPending}>Add member</button>
      </form>}
      {update.error && <p role="alert" className="text-sm text-rose-700">{update.error.message}</p>}
      {members.isPending && <Skeleton count={2} />}
      {members.error && <QueryError error={members.error} retry={() => void members.refetch()} />}
      <ul className="divide-y divide-slate-100">
        {members.data?.map((member) => <li key={member.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
          <div className="min-w-40 flex-1"><strong>{[member.user.firstName, member.user.lastName].filter(Boolean).join(" ")}</strong><p className="break-all text-slate-600">{member.user.email}</p></div>
          {canManage && member.role !== "OWNER" && member.user.id !== user?.id ? <>
            <select className="workspace-button" aria-label={`Role for ${member.user.email}`} disabled={update.isPending} value={member.role} onChange={(event) => update.mutate({ id: member.id, role: event.target.value as MemberRole })}>{roles.map((role) => <option key={role}>{role}</option>)}</select>
            <button className="workspace-button" disabled={update.isPending} onClick={() => { if (confirm(`Remove workspace access for ${member.user.email}?`)) update.mutate({ id: member.id }); }}>Remove access</button>
          </> : <span className="workspace-tag">{member.role}</span>}
        </li>)}
      </ul>
    </section>
  );
}
