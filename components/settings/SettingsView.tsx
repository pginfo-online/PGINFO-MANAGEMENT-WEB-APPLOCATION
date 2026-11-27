"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authActions, authStorage, api } from "@/lib/api/client";
import { usePropertyStore } from "@/lib/store";
import AddPropertyModal from "../drawers/AddPropertyModal";
import { PageHeading, QueryError, Skeleton } from "../layout/WorkspaceUI";

export default function SettingsView() {
  const user = authStorage.getUser();
  const propertyId = usePropertyStore((state) => state.selectedPropertyId);
  const [editProperty, setEditProperty] = useState(false);
  const organizations = useQuery({ queryKey: ["organizations"], queryFn: api.auth.listOrgs });
  const change = useMutation({ mutationFn: authActions.selectOrganization });
  const active = authStorage.getOrgId();

  return (
    <>
      <PageHeading title="Settings" description="Manage your account and switch between workspaces." />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="workspace-card space-y-3 p-5">
          <h2 className="text-lg font-semibold">Account</h2>
          <p className="font-medium">{[user?.firstName, user?.lastName].filter(Boolean).join(" ")}</p>
          <p className="break-all text-sm text-slate-600">{user?.email || (user?.mobile ? `+91 ${user.mobile}` : "")}</p>
          <button className="workspace-button" onClick={() => void authActions.logout()}>Sign out</button>
        </section>
        <section className="workspace-card space-y-3 p-5">
          <h2 className="text-lg font-semibold">Workspaces</h2>
          {organizations.isPending && <Skeleton count={2} />}
          {organizations.error && <QueryError error={organizations.error} retry={() => void organizations.refetch()} />}
          {organizations.data?.map((organization) => (
            <div className="flex flex-wrap items-center justify-between gap-3" key={organization.id}>
              <div><p className="font-medium">{organization.name}</p><p className="text-xs text-slate-600">{organization.role}</p></div>
              {active === organization.id ? <span className="workspace-tag">Current workspace</span> : <button className="workspace-button" disabled={change.isPending} onClick={() => change.mutate(organization.id)}>Switch</button>}
            </div>
          ))}
          {change.error && <p role="alert" className="text-sm text-rose-700">{change.error.message}</p>}
        </section>
        {propertyId && ["OWNER", "ADMIN", "MANAGER"].includes(user?.activeOrganizationRole ?? "") && <section className="workspace-card space-y-3 p-5">
          <h2 className="text-lg font-semibold">Property settings</h2>
          <p className="text-sm text-slate-600">Update the address, contact details and rent due day for the selected property.</p>
          <button className="workspace-button" onClick={() => setEditProperty(true)}>Edit property settings</button>
        </section>}
      </div>
      {editProperty && propertyId && <AddPropertyModal editId={propertyId} onClose={() => setEditProperty(false)} />}
    </>
  );
}
