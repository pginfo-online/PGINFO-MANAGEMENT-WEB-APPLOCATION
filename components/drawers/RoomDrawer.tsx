"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bed,
  Users,
  CheckCircle2,
  Tag,
  ShieldCheck,
  Edit,
  Share2,
  Ban,
  EyeOff,
  Trash2,
  UserPlus,
  MoreVertical,
  ExternalLink,
  History,
  Phone,
  Calendar,
  Check,
} from "lucide-react";
import { formatINR, cn } from "@/lib/utils";
import { api } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUiStore } from "@/lib/store";

interface RoomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  room: any | null;
  allRooms?: any[];
  onSelectRoom?: (room: any) => void;
  onOpenChooseBeds?: (room: any) => void;
  propertyId?: string;
}

export default function RoomDrawer({
  isOpen,
  onClose,
  room,
  allRooms = [],
  onSelectRoom,
  onOpenChooseBeds,
  propertyId,
}: RoomDrawerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setEditRoomOpen } = useUiStore();

  const [activeTab, setActiveTab] = useState<"Room" | "Tenants" | "Activity Log">("Room");
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  // Mutations for actions
  const disableRentMutation = useMutation({
    mutationFn: () => api.rooms.toggleDisableRent(room.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
      toast.success(
        room.isDisabledForRent
          ? `Room ${room.roomNumber} enabled for rent`
          : `Room ${room.roomNumber} disabled for rent`
      );
      setIsFabMenuOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update room rent availability");
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => api.rooms.togglePublish(room.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(
        room.isPublished
          ? `Room ${room.roomNumber} unpublished from listings`
          : `Room ${room.roomNumber} published to listings`
      );
      setIsFabMenuOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to toggle publication status");
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: () => api.rooms.delete(room.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
      toast.success(`Room ${room.roomNumber} deleted successfully`);
      setIsFabMenuOpen(false);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete room");
    },
  });

  if (!isOpen || !room) return null;

  // Previous / Next room navigation
  const currentIndex = allRooms.findIndex((r) => r.id === room.id);
  const prevRoom = currentIndex > 0 ? allRooms[currentIndex - 1] : null;
  const nextRoom =
    currentIndex >= 0 && currentIndex < allRooms.length - 1
      ? allRooms[currentIndex + 1]
      : null;

  const beds = room.beds || [];
  const isBedOccupied = (b: any) =>
    b.status === "OCCUPIED" ||
    b.status === "RESERVED" ||
    (b.residents && b.residents.length > 0);
  const occupiedBeds = beds.filter(isBedOccupied);
  const vacantBeds = beds.filter((b: any) => !isBedOccupied(b));

  // Residents list from beds
  const residentsList = beds.flatMap((b: any) =>
    (b.residents || []).map((res: any) => ({
      ...res,
      bedNumber: b.bedNumber,
      rentPaise: b.rentAmount ?? room.rentAmount,
    }))
  );

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/property/rooms/${room.id}`;
      navigator.clipboard.writeText(url);
      toast.success("Room link copied to clipboard!");
    }
  };

  const handleOpenEdit = () => {
    setIsFabMenuOpen(false);
    setEditRoomOpen(true, room);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete Room ${room.roomNumber}?`)) {
      deleteRoomMutation.mutate();
    }
  };

  const defaultRoomImage =
    room.images?.[0] ||
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 z-50 flex max-w-full">
        <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                  title="Close"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {room.roomNumber}
                </h2>
              </div>

              {/* Prev / Next Room buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => prevRoom && onSelectRoom?.(prevRoom)}
                  disabled={!prevRoom}
                  className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Previous Room"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => nextRoom && onSelectRoom?.(nextRoom)}
                  disabled={!nextRoom}
                  className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Next Room"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-6 px-6 border-t border-slate-100">
              {(["Room", "Tenants", "Activity Log"] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "py-3 text-xs font-semibold border-b-2 transition cursor-pointer",
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
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === "Room" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Photo & Main Info Block */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  {/* Photo */}
                  <div className="h-32 w-32 shrink-0 rounded-2xl overflow-hidden bg-slate-900 shadow-sm border border-slate-100">
                    <img
                      src={defaultRoomImage}
                      alt={room.roomNumber}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Room Overview */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {room.roomNumber}
                        </h3>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xl font-bold text-[#2F54EB]">
                            {formatINR(room.rentAmount)}
                          </span>
                          <span className="text-xs text-slate-400">/bed</span>
                        </div>
                      </div>

                      {/* See Details Link */}
                      <Link
                        href={`/property/rooms/${room.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition"
                      >
                        <span>See Details</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>

                    {/* Vacancy Badge */}
                    <div className="pt-1">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                        {vacantBeds.length} Bed Vacant
                      </span>
                    </div>

                    {/* Bed Chips Matrix */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {beds.map((b: any) => {
                        const isOccupied = isBedOccupied(b);
                        const resident = b.residents?.[0];
                        return (
                          <div
                            key={b.id}
                            title={
                              isOccupied
                                ? `Occupied${
                                    resident
                                      ? ` by ${resident.firstName}`
                                      : " (Reserved)"
                                  }`
                                : "Vacant"
                            }
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-xs",
                              isOccupied
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}
                          >
                            <Bed className="h-3.5 w-3.5" />
                            <span>{b.bedNumber}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Room Tags */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Room Tags
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
                      <Tag className="h-3 w-3 text-slate-400" />
                      <span>{vacantBeds.length} Bed Vacant</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
                      <Tag className="h-3 w-3 text-slate-400" />
                      <span>Unpaid Dues</span>
                    </span>
                    {room.unitType && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                        <Tag className="h-3 w-3 text-blue-500" />
                        <span>{room.unitType}</span>
                      </span>
                    )}
                    {room.isDisabledForRent && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                        <Ban className="h-3 w-3 text-amber-500" />
                        <span>Disabled for Rent</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Room Details Table */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Room Detail
                  </h4>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Sharing Type</span>
                      <span className="font-bold text-slate-900">{room.sharingType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Floor</span>
                      <span className="font-bold text-slate-900">
                        {room.floor || "Ground Floor"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Lock-in Period</span>
                      <span className="font-bold text-slate-900">
                        {room.lockInPeriod || "No Lock-in"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Unit Type</span>
                      <span className="font-bold text-slate-900">
                        {room.unitType || "Room"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Gender Allowed</span>
                      <span className="font-bold text-slate-900">
                        {room.gender || "UNISEX"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Status</span>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-bold",
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
                </div>

                {/* Amenities / Facilities */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Facilities & Amenities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities && room.amenities.length > 0 ? (
                      room.amenities.map((item: string) => (
                        <span
                          key={item}
                          className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium"
                        >
                          ✓ {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">
                        Attached bathroom, Geyser, Cupboard
                      </span>
                    )}
                  </div>
                </div>

                {/* Remarks */}
                {room.remarks && (
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Remarks
                    </h4>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {room.remarks}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tenants Tab */}
            {activeTab === "Tenants" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    Active Tenants ({residentsList.length})
                  </h4>
                  <button
                    onClick={() => onOpenChooseBeds?.(room)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2F54EB] text-white text-xs font-semibold shadow-xs hover:bg-blue-700 transition cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Add Tenant</span>
                  </button>
                </div>

                {residentsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold">No tenants in this room</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      All beds are currently vacant.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {residentsList.map((tenant: any) => (
                      <div
                        key={tenant.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2 hover:border-slate-300 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs">
                              {tenant.firstName?.[0] || "T"}
                            </div>
                            <div>
                              <span className="font-bold text-sm text-slate-900 block">
                                {tenant.firstName} {tenant.lastName || ""}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Bed: {tenant.bedNumber}
                              </span>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              tenant.status === "NOTICE_PERIOD"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            )}
                          >
                            {tenant.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {tenant.mobile}
                          </span>
                          <span className="font-bold text-slate-900">
                            {formatINR(tenant.rentPaise)}/mo
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activity Log Tab */}
            {activeTab === "Activity Log" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h4 className="text-sm font-bold text-slate-900">Room Timeline</h4>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
                  <div className="relative">
                    <span className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                    <p className="font-semibold text-slate-900">Room Inventory Active</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Configured with {beds.length} beds on {room.floor || "Ground Floor"}.
                    </p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                    <p className="font-semibold text-slate-900">Occupancy Verified</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {occupiedBeds.length} of {beds.length} beds allocated.
                    </p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                    <p className="font-semibold text-slate-900">Cleaning Checklist</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Routine weekly sanitization performed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Floating Action Menu Button (FAB) matching ref-2 & video */}
          <div className="relative p-6 pt-0 flex justify-end">
            {/* Pop-up Action Menu */}
            {isFabMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsFabMenuOpen(false)}
                />
                <div className="absolute bottom-16 right-6 z-50 w-52 rounded-2xl bg-[#2F54EB] text-white shadow-2xl p-1.5 space-y-0.5 border border-blue-400/30 animate-in slide-in-from-bottom-2 duration-150">
                  <button
                    onClick={() => {
                      setIsFabMenuOpen(false);
                      onOpenChooseBeds?.(room);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-blue-600 rounded-xl transition text-left cursor-pointer"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add Tenant</span>
                  </button>

                  <button
                    onClick={handleOpenEdit}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-blue-600 rounded-xl transition text-left cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsFabMenuOpen(false);
                      handleShare();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-blue-600 rounded-xl transition text-left cursor-pointer"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>

                  <button
                    onClick={() => disableRentMutation.mutate()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-blue-600 rounded-xl transition text-left cursor-pointer"
                  >
                    <Ban className="h-4 w-4" />
                    <span>
                      {room.isDisabledForRent ? "Enable for Rent" : "Disable for Rent"}
                    </span>
                  </button>

                  <button
                    onClick={() => publishMutation.mutate()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-blue-600 rounded-xl transition text-left cursor-pointer"
                  >
                    <EyeOff className="h-4 w-4" />
                    <span>{room.isPublished ? "Unpublish" : "Publish"}</span>
                  </button>

                  <div className="pt-1 border-t border-blue-400/40">
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-600/40 rounded-xl transition text-left cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 text-rose-300" />
                      <span>Delete Room</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* FAB Trigger Button */}
            <button
              onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
              className={cn(
                "h-12 w-12 rounded-full bg-[#2F54EB] hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center transition-all duration-200 cursor-pointer z-50",
                isFabMenuOpen ? "rotate-90 bg-blue-700" : ""
              )}
              title="Room Actions"
            >
              {isFabMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <MoreVertical className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
