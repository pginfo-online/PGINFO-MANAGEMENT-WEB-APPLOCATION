"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bed,
  Users,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Edit,
  Share2,
  MoreVertical,
  Trash2,
  Ban,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Info,
  Building,
  Settings,
  FileText,
  Loader2,
  Check,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatINR, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUiStore } from "@/lib/store";

export default function RoomProfile360({ roomId }: { roomId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setEditRoomOpen } = useUiStore();

  const [activeTab, setActiveTab] = useState<
    "Room Detail" | "Tenants" | "Settings" | "SubUnits" | "Rental agreement"
  >("Room Detail");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [facilitiesOpen, setFacilitiesOpen] = useState(true);

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => api.rooms.get(roomId),
  });

  // Mutations
  const disableRentMutation = useMutation({
    mutationFn: () => api.rooms.toggleDisableRent(roomId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(
        updated.isDisabledForRent
          ? `Room ${room.roomNumber} disabled for rent`
          : `Room ${room.roomNumber} enabled for rent`
      );
      setIsMenuOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update"),
  });

  const publishMutation = useMutation({
    mutationFn: () => api.rooms.togglePublish(roomId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(
        updated.isPublished
          ? `Room ${room.roomNumber} published to listings`
          : `Room ${room.roomNumber} unpublished from listings`
      );
      setIsMenuOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update"),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: () => api.rooms.delete(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(`Room ${room.roomNumber} deleted successfully`);
      router.push("/property/rooms");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete room"),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#2F54EB]" />
        <span className="text-xs font-semibold">Loading room profile...</span>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-12 text-center text-slate-500 max-w-md mx-auto">
        <Bed className="h-10 w-10 mx-auto text-slate-300 mb-3" />
        <h3 className="font-bold text-slate-900 text-lg">Room Not Found</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          The requested room does not exist or has been removed.
        </p>
        <Link
          href="/property/rooms"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2F54EB] text-white text-xs font-semibold shadow-xs"
        >
          Return to Rooms Inventory
        </Link>
      </div>
    );
  }

  const beds = room.beds || [];
  const occupiedBeds = beds.filter(
    (b: any) =>
      b.status === "OCCUPIED" || (b.residents && b.residents.length > 0)
  );
  const vacantBeds = beds.filter(
    (b: any) =>
      b.status === "AVAILABLE" && (!b.residents || b.residents.length === 0)
  );

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Room link copied to clipboard!");
    }
    setIsMenuOpen(false);
  };

  const handleDeleteRoom = () => {
    setIsMenuOpen(false);
    if (confirm(`Are you sure you want to delete Room ${room.roomNumber}?`)) {
      deleteRoomMutation.mutate();
    }
  };

  const defaultRoomImage =
    room.images?.[0] ||
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Switcher Strip */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        {/* Navigation Tabs matching ref-4 */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              "Room Detail",
              "Tenants",
              "Settings",
              "SubUnits",
              "Rental agreement",
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "py-2 px-4 text-xs font-semibold whitespace-nowrap transition cursor-pointer border-b-2",
                  isActive
                    ? "border-[#2F54EB] text-[#2F54EB] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Prev / Next Room buttons */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <Link
            href="/property/rooms"
            className="h-8 px-3 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            ← All Rooms
          </Link>
          <button
            onClick={() => toast.info("Viewing room controls")}
            className="h-8 w-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:text-slate-700 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => toast.info("Viewing room controls")}
            className="h-8 w-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:text-slate-700 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main 2-Section Layout matching ref-4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section: Room Image, Beds Matrix, Tags, Room Type */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            {/* Room Photo */}
            <div className="h-56 w-full rounded-2xl overflow-hidden bg-slate-900 relative shadow-inner">
              <img
                src={defaultRoomImage}
                alt={room.roomNumber}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">
                Floor: {room.floor || "Ground Floor"}
              </div>
            </div>

            {/* Room Number & Rent */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{room.roomNumber}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-lg font-bold text-[#2F54EB]">
                  {formatINR(room.rentAmount)}
                </span>
                <span className="text-xs text-slate-400">/bed</span>
              </div>
            </div>

            {/* Bed Chips Grid matching ref-4: BedA, BedB, BedC, +1 More */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {beds.slice(0, 3).map((b: any) => {
                const isOccupied =
                  b.status === "OCCUPIED" ||
                  (b.residents && b.residents.length > 0);
                return (
                  <div
                    key={b.id}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-2xl border transition select-none shadow-2xs",
                      isOccupied
                        ? "bg-rose-50/70 border-rose-200 text-rose-700"
                        : "bg-emerald-50/70 border-emerald-200 text-emerald-700"
                    )}
                  >
                    <Bed className="h-4 w-4 mb-1" />
                    <span className="text-xs font-bold">{b.bedNumber}</span>
                  </div>
                );
              })}

              {beds.length > 3 ? (
                <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 select-none shadow-2xs">
                  <Info className="h-4 w-4 mb-1 text-slate-400" />
                  <span className="text-[11px] font-bold">
                    +{beds.length - 3} More
                  </span>
                </div>
              ) : beds.length === 0 ? (
                <span className="text-xs text-slate-400 col-span-4 py-2">
                  No beds configured
                </span>
              ) : null}
            </div>

            {/* Room Tags matching ref-4 */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Room Tags
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <Check className="h-3.5 w-3.5" />
                  <span>{vacantBeds.length} bed vacant</span>
                </span>
                {room.isDisabledForRent && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                    <Ban className="h-3.5 w-3.5" />
                    <span>Disabled for Rent</span>
                  </span>
                )}
                {!room.isPublished && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Unpublished</span>
                  </span>
                )}
              </div>
            </div>

            {/* Room Type */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Room Type
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {room.sharingType} {room.unitType || "Standard Room"} ·{" "}
                {room.gender || "UNISEX"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Details & Facilities Accordions matching ref-4 */}
        <div className="lg:col-span-7 space-y-5">
          {/* Details Accordion */}
          <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="w-full p-5 border-b border-slate-100 flex items-center justify-between text-left hover:bg-slate-50/50 transition cursor-pointer select-none"
            >
              <h3 className="text-base font-bold text-slate-900">Details</h3>
              {detailsOpen ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {detailsOpen && (
              <div className="p-6 space-y-4 text-sm divide-y divide-slate-100 animate-in fade-in duration-200">
                <div className="flex justify-between items-center pb-3">
                  <span className="text-slate-500 font-medium text-xs">Room</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {room.roomNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-500 font-medium text-xs">Unit Type</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {room.unitType || "Room"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-500 font-medium text-xs">Floor</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {room.floor || "Ground Floor"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-500 font-medium text-xs">Sharing</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {room.sharingType}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-500 font-medium text-xs">Rent</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatINR(room.rentAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <span className="text-slate-500 font-medium text-xs">Status</span>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase",
                      room.status === "OCCUPIED"
                        ? "bg-rose-100 text-rose-700"
                        : room.status === "PARTIALLY_OCCUPIED"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {room.status}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Facilities Accordion */}
          <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <button
              onClick={() => setFacilitiesOpen(!facilitiesOpen)}
              className="w-full p-5 border-b border-slate-100 flex items-center justify-between text-left hover:bg-slate-50/50 transition cursor-pointer select-none"
            >
              <h3 className="text-base font-bold text-slate-900">Facilities</h3>
              {facilitiesOpen ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {facilitiesOpen && (
              <div className="p-6 animate-in fade-in duration-200">
                {room.amenities && room.amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((item: string) => (
                      <span
                        key={item}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">No Facilities recorded</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar matching ref-4 */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center shadow-2xl">
        <div className="flex items-center rounded-2xl bg-[#2F54EB] text-white shadow-xl overflow-visible border border-blue-400/40">
          {/* Add Tenant Button */}
          <Link
            href={`/people/tenants/addTenant?roomId=${room.id}`}
            className="flex items-center gap-1.5 px-4 py-2.5 hover:bg-blue-700 text-xs font-semibold border-r border-blue-400/40 transition rounded-l-2xl"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Tenant</span>
          </Link>

          {/* Edit */}
          <button
            onClick={() => setEditRoomOpen(true, room)}
            className="flex items-center gap-1.5 px-4 py-2.5 hover:bg-blue-700 text-xs font-semibold border-r border-blue-400/40 transition cursor-pointer"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2.5 hover:bg-blue-700 text-xs font-semibold border-r border-blue-400/40 transition cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 hover:bg-blue-700 transition cursor-pointer rounded-r-2xl"
              title="More Room Actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute bottom-12 right-0 w-48 rounded-2xl bg-[#2F54EB] text-white shadow-2xl border border-blue-400/40 p-1.5 space-y-0.5 z-50 animate-in slide-in-from-bottom-2 duration-150">
                  <button
                    onClick={() => disableRentMutation.mutate()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-blue-700 rounded-xl transition text-left cursor-pointer"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    <span>
                      {room.isDisabledForRent
                        ? "Enable for Rent"
                        : "Disable for Rent"}
                    </span>
                  </button>

                  <button
                    onClick={() => publishMutation.mutate()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-blue-700 rounded-xl transition text-left cursor-pointer"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>{room.isPublished ? "Unpublish" : "Publish"}</span>
                  </button>

                  <div className="pt-1 border-t border-blue-400/40">
                    <button
                      onClick={handleDeleteRoom}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-600/40 rounded-xl transition text-left cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-300" />
                      <span>Delete Room</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
