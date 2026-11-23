"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { Building2, Check, Plus, Search, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { QueryError, Skeleton } from "./WorkspaceUI";

export default function PropertySelectorModal() {
  const { isPropertySelectorOpen, setPropertySelectorOpen, setAddPropertyOpen } = useUiStore();
  const { selectedPropertyId, setSelectedPropertyId } = usePropertyStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const properties = useQuery({
    queryKey: ["properties", "picker", search, page],
    queryFn: () => api.properties.list({ search: search.trim(), page, limit: 20 }),
    enabled: isPropertySelectorOpen,
  });

  function select(id: string | null, name?: string) {
    setSelectedPropertyId(id, name);
    setPropertySelectorOpen(false);
  }

  return (
    <Dialog.Root open={isPropertySelectorOpen} onOpenChange={setPropertySelectorOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="workspace-overlay" />
        <Dialog.Content className="workspace-dialog">
          <div className="flex justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-semibold">Switch property</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-600">Choose the property you want to manage.</Dialog.Description>
            </div>
            <Dialog.Close aria-label="Close property selector" className="workspace-icon"><X className="size-5" /></Dialog.Close>
          </div>
          <label className="workspace-search mt-5">
            <Search className="size-4" />
            <input aria-label="Search properties" placeholder="Search properties" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          </label>
          <div className="my-4 space-y-2">
            <button className="property-option" aria-pressed={!selectedPropertyId} onClick={() => select(null)}>
              <Building2 className="size-5" /> <span className="flex-1">All properties</span>
              {!selectedPropertyId && <Check className="size-4" />}
            </button>
            {properties.isPending && <Skeleton count={3} />}
            {properties.error && <QueryError error={properties.error} retry={() => void properties.refetch()} />}
            {properties.data?.data.map((property) => (
              <button className="property-option" key={property.id} aria-pressed={selectedPropertyId === property.id} onClick={() => select(property.id, property.name)}>
                <Building2 className="size-5" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{property.name}</span>
                  <span className="block truncate text-xs text-slate-600">{[property.type.replaceAll("_", " "), property.city].filter(Boolean).join(" · ")}</span>
                </span>
                {selectedPropertyId === property.id && <Check className="size-4" />}
              </button>
            ))}
            {properties.isSuccess && properties.data.data.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-600">{search ? "No properties match your search." : "Your workspace has no properties yet."}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button className="workspace-button primary" onClick={() => { setPropertySelectorOpen(false); setAddPropertyOpen(true); }}><Plus className="size-4" /> Add property</button>
            <div className="flex gap-2">
              {page > 1 && <button className="workspace-button" onClick={() => setPage(page - 1)}>Previous</button>}
              {properties.data?.meta.hasMore && <button className="workspace-button" onClick={() => setPage(page + 1)}>Next</button>}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
