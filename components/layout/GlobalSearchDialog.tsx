"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Search, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { QueryError, Skeleton } from "./WorkspaceUI";

export default function GlobalSearchDialog() {
  const { isSearchOpen, setSearchOpen } = useUiStore();
  const { selectedPropertyId, setSelectedPropertyId } = usePropertyStore();
  const [value, setValue] = useState("");
  const search = useDeferredValue(value.trim());
  const enabled = isSearchOpen && search.length > 1;
  const tenants = useQuery({
    queryKey: ["residents", "global-search", selectedPropertyId, search],
    queryFn: () => api.residents.list({ propertyId: selectedPropertyId ?? undefined, search, limit: 8 }),
    enabled,
  });
  const properties = useQuery({
    queryKey: ["properties", "global-search", search],
    queryFn: () => api.properties.list({ search, limit: 6 }),
    enabled: enabled && !selectedPropertyId,
  });
  const rooms = useQuery({
    queryKey: ["rooms", "global-search", selectedPropertyId, search],
    queryFn: ({ signal }) => api.rooms.page(selectedPropertyId!, { search, limit: 8 }, signal),
    enabled: enabled && !!selectedPropertyId,
  });
  const locationResults = selectedPropertyId ? rooms : properties;
  const pending = enabled && (tenants.isPending || locationResults.isPending);
  const error = enabled && (tenants.error ?? locationResults.error);
  const hasResults = Boolean(tenants.data?.data.length || locationResults.data?.data.length);

  return (
    <Dialog.Root open={isSearchOpen} onOpenChange={setSearchOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="workspace-overlay" />
        <Dialog.Content className="workspace-dialog">
          <div className="flex justify-between gap-3">
            <div><Dialog.Title className="text-xl font-semibold">Search workspace</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-600">{selectedPropertyId ? "Find tenants or rooms in the selected property." : "Find tenants or properties in your workspace."}</Dialog.Description></div>
            <Dialog.Close className="workspace-icon" aria-label="Close search"><X className="size-5" /></Dialog.Close>
          </div>
          <label className="workspace-search mb-4 mt-5"><Search className="size-4" /><input aria-label="Search workspace" value={value} onChange={(event) => setValue(event.target.value)} maxLength={100} placeholder="Enter at least two characters" /></label>
          {pending && <Skeleton count={3} />}
          {error && <QueryError error={error} retry={() => { if (tenants.error) void tenants.refetch(); if (locationResults.error) void locationResults.refetch(); }} />}
          {enabled && !pending && !error && !hasResults && <p className="py-5 text-sm text-slate-600">No matches found.</p>}
          {enabled && <div className="space-y-2">
            {tenants.data?.data.map((tenant) => <Link key={tenant.id} className="property-option" href={`/people/tenants/${tenant.id}`} onClick={() => setSearchOpen(false)}><span className="flex-1">{[tenant.firstName, tenant.lastName].filter(Boolean).join(" ")}<span className="block text-xs text-slate-600">{tenant.property?.name ?? "Tenant"}</span></span><ArrowUpRight className="size-4" /></Link>)}
            {selectedPropertyId ? rooms.data?.data.map((room) => <Link key={room.id} className="property-option" href={`/property/rooms/${room.id}`} onClick={() => setSearchOpen(false)}><span className="flex-1">Room {room.roomNumber}</span><ArrowUpRight className="size-4" /></Link>) : properties.data?.data.map((property) => <Link key={property.id} className="property-option" href="/property" onClick={() => { setSelectedPropertyId(property.id, property.name); setSearchOpen(false); }}><span className="flex-1">{property.name}<span className="block text-xs text-slate-600">{property.city}</span></span><ArrowUpRight className="size-4" /></Link>)}
          </div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
