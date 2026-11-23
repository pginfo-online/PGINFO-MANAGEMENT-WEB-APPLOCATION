"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { QueryError, Skeleton } from "../layout/WorkspaceUI";

export interface Allocation {
  propertyId: string;
  roomId: string;
  bedId: string;
}

interface InventoryBed {
  id: string;
  bedNumber: string;
  status: string;
  isDisabledForRent?: boolean;
  rentAmount?: number | null;
}

export function useAllocationInventory({ propertyId, roomId }: Allocation) {
  const properties = useQuery({ queryKey: ["properties", "allocation"], queryFn: () => api.properties.list({ limit: 100 }) });
  const property = useQuery({
    queryKey: ["properties", "detail", propertyId],
    queryFn: () => api.properties.get(propertyId),
    enabled: !!propertyId,
  });
  const rooms = useQuery({
    queryKey: ["rooms", propertyId],
    queryFn: () => api.rooms.listByProperty(propertyId),
    enabled: !!propertyId,
  });
  const selectedRoom = rooms.data?.find((room) => room.id === roomId && !room.isDisabledForRent && room.status !== "UNDER_MAINTENANCE");
  const detail = useQuery({
    queryKey: ["room", selectedRoom?.id],
    queryFn: () => api.rooms.get(selectedRoom!.id),
    enabled: !!selectedRoom,
  });
  const beds: InventoryBed[] = (detail.data?.beds ?? []).filter((bed: InventoryBed) => bed.status === "AVAILABLE" && !bed.isDisabledForRent);
  return { properties, property, rooms, detail, selectedRoom, beds };
}

export default function AllocationFields({ value, change, inventory, requireRoom = false, excludeRoomId }: {
  value: Allocation;
  change: (value: Allocation) => void;
  inventory: ReturnType<typeof useAllocationInventory>;
  requireRoom?: boolean;
  excludeRoomId?: string;
}) {
  const { properties, property, rooms, detail, selectedRoom, beds } = inventory;
  const isLoading = properties.isPending || (!!value.propertyId && rooms.isPending) || (!!selectedRoom && detail.isPending);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <label>Property<select required value={value.propertyId} onChange={(event) => change({ propertyId: event.target.value, roomId: "", bedId: "" })}>
          <option value="">Choose property</option>
          {property.data && !properties.data?.data.some((item) => item.id === property.data.id) && <option value={value.propertyId}>{property.data.name}</option>}
          {properties.data?.data.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        <label>Room<select required={requireRoom} disabled={!value.propertyId} value={value.roomId} onChange={(event) => change({ ...value, roomId: event.target.value, bedId: "" })}>
          <option value="">{requireRoom ? "Choose room" : "Unassigned"}</option>
          {rooms.data?.filter((room) => !room.isDisabledForRent && room.status !== "UNDER_MAINTENANCE" && room.id !== excludeRoomId).map((room) => <option key={room.id} value={room.id}>Room {room.roomNumber}</option>)}
        </select></label>
        <label>Bed<select disabled={!selectedRoom || detail.isPending} value={value.bedId} onChange={(event) => change({ ...value, bedId: event.target.value })}>
          <option value="">Unassigned</option>
          {beds.map((bed) => <option key={bed.id} value={bed.id}>{bed.bedNumber}</option>)}
        </select></label>
      </div>
      {isLoading && <Skeleton count={1} />}
      {[properties, property, rooms, detail].filter((query) => query.error).map((query, index) => <QueryError key={index} error={query.error!} retry={() => void query.refetch()} />)}
      {value.roomId && rooms.isSuccess && !selectedRoom && <p role="alert" className="text-sm text-rose-700">Choose a room that is available for rent.</p>}
      {value.bedId && detail.isSuccess && !beds.some((bed) => bed.id === value.bedId) && <p role="alert" className="text-sm text-rose-700">This bed is no longer available. Choose another bed or leave it unassigned.</p>}
    </>
  );
}
