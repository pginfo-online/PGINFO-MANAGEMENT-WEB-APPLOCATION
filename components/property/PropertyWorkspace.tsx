"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BedDouble, Building2, Plus, Search } from "lucide-react";
import AddPropertyModal from "../drawers/AddPropertyModal";
import { api } from "@/lib/api/client";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { formatINR } from "@/lib/utils";
import { PageHeading, QueryError, Skeleton } from "../layout/WorkspaceUI";

export default function PropertyWorkspace() {
  const { selectedPropertyId, activePropertyName, setSelectedPropertyId } = usePropertyStore();
  const { setAddRoomOpen, setAddPropertyOpen } = useUiStore();
  const [search, setSearch] = useState("");
  const [vacancy, setVacancy] = useState("");
  const [floor, setFloor] = useState("");
  const [editId, setEditId] = useState<string>();
  const [pagination, setPagination] = useState({ scope: "", page: 1 });
  const term = useDeferredValue(search.trim());
  const scope = JSON.stringify([selectedPropertyId, term, floor, vacancy]);
  const page = pagination.scope === scope ? pagination.page : 1;
  const properties = useQuery({
    queryKey: ["properties", "workspace", term, page],
    queryFn: () => api.properties.list({ search: term, page, limit: 12 }),
    enabled: !selectedPropertyId,
  });
  const rooms = useQuery({
    queryKey: ["rooms", selectedPropertyId, term, floor, vacancy, page],
    queryFn: ({ signal }) => api.rooms.page(selectedPropertyId!, { search: term, page, limit: 12, floor: floor.trim(), vacancy }, signal),
    enabled: !!selectedPropertyId,
  });
  const list = selectedPropertyId ? rooms : properties;

  return (
    <>
      <PageHeading title={selectedPropertyId ? activePropertyName : "Properties"} description={selectedPropertyId ? "Review occupancy, room availability and rent." : "Choose a property to manage its rooms and beds."} action={
        <div className="flex flex-wrap gap-2">
        {selectedPropertyId && <button className="workspace-button" onClick={() => setEditId(selectedPropertyId)}>Edit property</button>}
        <button className="workspace-button primary" onClick={() => selectedPropertyId ? setAddRoomOpen(true) : setAddPropertyOpen(true)}>
          <Plus className="size-4" />{selectedPropertyId ? "Add room" : "Add property"}
        </button>
        </div>
      } />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="workspace-search max-w-sm">
          <Search className="size-4" /><input aria-label={selectedPropertyId ? "Search rooms" : "Search properties"} placeholder={selectedPropertyId ? "Search room numbers" : "Search properties"} value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        {selectedPropertyId && <>
          <input className="workspace-button max-w-28" aria-label="Filter floor" placeholder="Floor" value={floor} onChange={(event) => setFloor(event.target.value)} />
          <select className="workspace-button" aria-label="Filter availability" value={vacancy} onChange={(event) => setVacancy(event.target.value)}>
            <option value="">All availability</option><option value="VACANT">Has vacancy</option><option value="FULL">Full</option>
          </select>
          <button className="workspace-button" onClick={() => { setSearch(""); setFloor(""); setVacancy(""); setSelectedPropertyId(null); }}>All properties</button>
        </>}
      </div>
      {list.isPending && <Skeleton layout="cards" count={8} />}
      {list.error && <QueryError error={list.error} retry={() => void list.refetch()} />}
      {list.isSuccess && list.data.data.length === 0 && <div className="workspace-card p-8 text-sm text-slate-600">{term || (selectedPropertyId && (floor || vacancy)) ? "No matches found." : selectedPropertyId ? "This property has no rooms yet." : "Add a property to start managing rooms and beds."}</div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {!selectedPropertyId && properties.data?.data.map((property) => (
          <button key={property.id} className="workspace-card interactive p-5 text-left" onClick={() => { setSearch(""); setSelectedPropertyId(property.id, property.name); }}>
            <span className="workspace-icon-tile"><Building2 className="size-5" /></span>
            <h2 className="mt-4 text-lg font-semibold">{property.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{[property.addressLine1, property.city, property.state].filter(Boolean).join(", ")}</p>
            <p className="mt-4 text-xs font-semibold text-emerald-800">{property.type.replaceAll("_", " ")}</p>
          </button>
        ))}
        {selectedPropertyId && rooms.data?.data.map((room) => (
          <Link key={room.id} href={`/property/rooms/${room.id}`} className="workspace-card interactive p-5">
            <div className="flex items-start justify-between gap-3"><span className="workspace-icon-tile"><BedDouble className="size-5" /></span><span className="workspace-tag">{room.status.replaceAll("_", " ")}</span></div>
            <h2 className="mt-4 text-lg font-semibold">Room {room.roomNumber}</h2>
            <p className="mt-1 text-sm text-slate-600">{[room.floor != null ? `Floor ${room.floor}` : null, room.sharingType?.replaceAll("_", " ")].filter(Boolean).join(" · ")}</p>
            <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3 text-sm"><span>{room.beds?.filter((bed) => bed.status === "AVAILABLE").length ?? 0} available beds</span><strong>{formatINR(room.rentAmount)}</strong></div>
          </Link>
        ))}
      </div>
      {(page > 1 || list.data?.meta.hasMore) && <div className="mt-5 flex justify-end gap-2">
        <button className="workspace-button" disabled={page === 1} onClick={() => setPagination({ scope, page: page - 1 })}>Previous</button>
        <button className="workspace-button" disabled={!list.data?.meta.hasMore} onClick={() => setPagination({ scope, page: page + 1 })}>Next</button>
      </div>}
      {editId && <AddPropertyModal editId={editId} onClose={() => setEditId(undefined)} />}
    </>
  );
}
