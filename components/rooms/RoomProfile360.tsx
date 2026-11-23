"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BedDouble, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { useUiStore } from "@/lib/store";
import { formatDate, formatDateTime, formatINR } from "@/lib/utils";
import { PageHeading, QueryError, Skeleton } from "../layout/WorkspaceUI";

interface Bed {
  id: string;
  bedNumber: string;
  status: string;
  rentAmount?: number;
  residents?: { id: string; firstName: string; lastName?: string; status: string }[];
  bookings?: { id: string; guestName: string; expectedMoveIn?: string }[];
}

type Operation = "listing" | "rent" | "archive";

export default function RoomProfile360({ roomId }: { roomId: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const edit = useUiStore((state) => state.setEditRoomOpen);
  const roomQuery = useQuery({ queryKey: ["room", roomId], queryFn: () => api.rooms.get(roomId) });
  const activity = useQuery({ queryKey: ["room", roomId, "activity"], queryFn: ({ signal }) => api.dashboard.activity("Room", roomId, signal), enabled: roomQuery.isSuccess });
  const update = useMutation({
    mutationFn: (operation: Operation) => ({
      listing: api.rooms.togglePublish,
      rent: api.rooms.toggleDisableRent,
      archive: api.rooms.delete,
    })[operation](roomId),
    onSuccess(_, operation) {
      for (const key of ["rooms", "inventoryStats", "dashboardMetrics"]) void client.invalidateQueries({ queryKey: [key] });
      if (operation === "archive") {
        toast.success("Room archived");
        router.replace("/property");
      } else {
        void client.invalidateQueries({ queryKey: ["room", roomId] });
        toast.success("Room updated");
      }
    },
    onError(error) { toast.error(error.message); },
  });
  if (roomQuery.isPending) return <Skeleton layout="cards" count={6} />;
  if (roomQuery.error) return <QueryError error={roomQuery.error} retry={() => void roomQuery.refetch()} />;
  const room = roomQuery.data;
  const beds: Bed[] = room.beds ?? [];
  const active = room.status !== "ARCHIVED";
  return (
    <>
      <Link className="workspace-button mb-4" href="/property"><ArrowLeft className="size-4" /> Properties</Link>
      <PageHeading title={`Room ${room.roomNumber}`} description={[room.property?.name, room.floor != null && `Floor ${room.floor}`, room.sharingType?.replaceAll("_", " ")].filter(Boolean).join(" · ")} action={
        active && <button className="workspace-button primary" onClick={() => edit(true, room)}>Edit room</button>
      } />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(15rem,1fr)_minmax(0,2fr)]">
        <div className="space-y-5">
          <section className="workspace-card p-5">
            <div className="flex justify-between gap-3"><h2 className="font-semibold">Room details</h2><span className="workspace-tag">{room.status?.replaceAll("_", " ")}</span></div>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Rent per bed or unit", formatINR(room.rentAmount)], ["Beds", beds.length],
                ["Available", beds.filter((bed) => bed.status === "AVAILABLE").length],
                ["Renting", room.isDisabledForRent ? "Paused" : "Enabled"],
                ["Listing", room.isPublished ? "Published" : "Unpublished"],
              ].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-slate-600">{label}</dt><dd className="font-medium">{value}</dd></div>)}
            </dl>
            {!!room.amenities?.length && <div className="mt-4 flex flex-wrap gap-2">{room.amenities.map((amenity: string) => <span className="workspace-tag" key={amenity}>{amenity}</span>)}</div>}
            {room.remarks && <p className="mt-4 break-words text-sm text-slate-600">{room.remarks}</p>}
            {active && <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <button className="workspace-button" disabled={update.isPending} onClick={() => update.mutate("rent")}>{room.isDisabledForRent ? "Enable renting" : "Pause renting"}</button>
              <button className="workspace-button" disabled={update.isPending} onClick={() => update.mutate("listing")}>{room.isPublished ? "Unpublish" : "Publish"}</button>
              <button className="workspace-button text-rose-700" disabled={update.isPending} onClick={() => { if (confirm(`Archive room ${room.roomNumber}?`)) update.mutate("archive"); }}>Archive</button>
            </div>}
          </section>
          <section className="workspace-card p-5">
            <h2 className="mb-4 font-semibold">Recent activity</h2>
            {activity.isPending && <Skeleton count={2} />}
            {activity.error && <QueryError error={activity.error} retry={() => void activity.refetch()} />}
            {activity.isSuccess && !activity.data.data.length && <p className="text-sm text-slate-600">No activity recorded.</p>}
            <ul className="divide-y divide-slate-100">
              {activity.data?.data.slice(0, 6).map((entry) => <li key={entry.id} className="py-2 text-sm">{entry.action.replaceAll(/[._]/g, " ")}<span className="mt-1 block text-xs text-slate-600">{formatDateTime(entry.createdAt)}</span></li>)}
            </ul>
          </section>
        </div>
        <section className="workspace-card p-5">
          <h2 className="mb-4 font-semibold">Beds and occupants</h2>
          {!beds.length && <p className="text-sm text-slate-600">No beds are configured for this room.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {beds.map((bed) => (
              <article className="workspace-card p-4" key={bed.id}>
                <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 font-semibold"><BedDouble className="size-4" />{bed.bedNumber}</h3><span className="workspace-tag">{bed.status.replaceAll("_", " ")}</span></div>
                <p className="mt-3 text-sm text-slate-600">{formatINR(bed.rentAmount ?? room.rentAmount)} / month</p>
                {bed.residents?.map((resident) => <Link className="mt-2 block text-sm underline underline-offset-2" key={resident.id} href={`/people/tenants/${resident.id}`}>{[resident.firstName, resident.lastName].filter(Boolean).join(" ")}</Link>)}
                {bed.bookings?.map((booking) => <p key={booking.id} className="mt-2 text-sm text-slate-600">{booking.guestName}{booking.expectedMoveIn ? ` · expected ${formatDate(booking.expectedMoveIn)}` : ""}</p>)}
                {active && !room.isDisabledForRent && bed.status === "AVAILABLE" && (
                  <Link className="workspace-button mt-3" href={`/people/tenants/addTenant?${new URLSearchParams({ propertyId: room.propertyId, roomId, bedId: bed.id, bedNumber: bed.bedNumber })}`}><Plus className="size-4" /> Add tenant</Link>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
