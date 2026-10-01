'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BedDouble,
  Building,
  Edit,
  Trash2,
  Users,
  CheckCircle2,
  Wind,
  Bath,
  Zap,
  Wifi,
  Sun,
  Flame,
  Tv,
  Lock,
  Shirt,
  IndianRupee,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatINR } from '@/lib/utils';
import {
  useRoomDetail,
  useUpdateRoom,
  useDeleteRoom,
  useUpdateBed,
  useAssignResident,
  useVacateBed,
} from '@/features/rooms/hooks/useRooms';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { BedCard } from '@/features/rooms/components/BedCard';
import { AddEditRoomModal } from '@/features/rooms/components/AddEditRoomModal';
import { AssignResidentModal } from '@/features/rooms/components/AssignResidentModal';
import { EditBedModal } from '@/features/rooms/components/EditBedModal';
import { VacateBedDialog } from '@/features/rooms/components/VacateBedDialog';
import type { Bed, CreatePGRoomPayload, UpdateBedPayload } from '@/types/property';
import type { AssignResidentPayload } from '@/features/rooms/api/rooms.api';

// Amenity Icon Map
const AMENITY_ICON_MAP: Record<string, React.ReactNode> = {
  'Attached Washroom': <Bath className="h-4 w-4" />,
  'Common Bathroom': <Bath className="h-4 w-4" />,
  'Wi-Fi': <Wifi className="h-4 w-4" />,
  Balcony: <Sun className="h-4 w-4" />,
  Geyser: <Flame className="h-4 w-4" />,
  AC: <Wind className="h-4 w-4" />,
  TV: <Tv className="h-4 w-4" />,
  Wardrobe: <Shirt className="h-4 w-4" />,
  Cupboard: <Shirt className="h-4 w-4" />,
  Locker: <Lock className="h-4 w-4" />,
};

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;
  const roomId = params.roomId as string;

  // Modals state
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [selectedBedForAssign, setSelectedBedForAssign] = useState<Bed | null>(null);
  const [selectedBedForEdit, setSelectedBedForEdit] = useState<Bed | null>(null);
  const [selectedBedForVacate, setSelectedBedForVacate] = useState<Bed | null>(null);
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState(false);

  // Queries & Mutations
  const { data: detailData, isLoading, error } = useRoomDetail(roomId);
  const { data: dashboardData } = useQuery({
    queryKey: ['property-dashboard', propertyId],
    queryFn: () => dashboardApi.getPropertyDashboard(propertyId),
    enabled: !!propertyId,
  });
  const property = dashboardData?.data?.property;

  const updateRoomMutation = useUpdateRoom(propertyId);
  const deleteRoomMutation = useDeleteRoom(propertyId);
  const updateBedMutation = useUpdateBed(propertyId, roomId);
  const assignResidentMutation = useAssignResident(propertyId, roomId);
  const vacateBedMutation = useVacateBed(propertyId, roomId);

  const room = detailData?.room;

  // Resolve effective rent with fallback to property roomConfigs
  const effectiveRoomRent = useMemo(() => {
    if (room?.rentPerBed && room.rentPerBed > 0) return room.rentPerBed;
    if (room?.rent && room.rent > 0) return room.rent;
    const config = property?.roomConfigs?.find(
      (c: { shareType?: string }) => c.shareType === room?.shareType
    );
    return config?.rent || 0;
  }, [room, property]);

  const displayRoom = useMemo(() => {
    if (!room) return null;
    return {
      ...room,
      rentPerBed: effectiveRoomRent,
      rent: effectiveRoomRent,
    };
  }, [room, effectiveRoomRent]);

  const beds: Bed[] = useMemo(() => {
    return detailData?.beds || room?.beds || [];
  }, [detailData, room]);

  const totalBeds = Number(room?.totalBeds || room?.capacity || (beds.length > 0 ? beds.length : 1));
  const occupiedBeds = beds.filter(
    (b) => b.status === 'occupied' || (b as unknown as { isOccupied?: boolean }).isOccupied
  ).length;
  const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const isFull = occupiedBeds >= totalBeds && totalBeds > 0;
  const isVacant = occupiedBeds === 0;

  const floorDisplay = room?.floorLabel
    ? room.floorLabel.charAt(0).toUpperCase() +
      room.floorLabel.slice(1) +
      (room.floorLabel.toLowerCase().includes('floor') ? '' : ' Floor')
    : 'Ground Floor';

  // Room Actions
  const handleUpdateRoomSubmit = async (payload: CreatePGRoomPayload) => {
    if (!room) return;
    try {
      const rentVal = payload.rentPerBed ?? payload.rent ?? 0;
      await updateRoomMutation.mutateAsync({
        roomId: room._id,
        payload: {
          roomNumber: payload.roomNumber,
          floorLabel: payload.floorLabel,
          shareType: payload.shareType,
          totalBeds: payload.totalBeds,
          rentPerBed: rentVal,
          rent: rentVal,
          monthlyRent: rentVal,
          ac: payload.ac,
          acIncluded: payload.acIncluded,
          attachedBathroom: payload.attachedBathroom,
          bathroomType: payload.bathroomType,
          amenities: payload.amenities,
        },
      });
      setIsEditRoomOpen(false);
    } catch (err) {
      console.error('Failed to update room:', err);
    }
  };

  const handleDeleteRoom = async () => {
    if (occupiedBeds > 0) return;
    try {
      await deleteRoomMutation.mutateAsync(roomId);
      router.push(`/properties/${propertyId}/rooms`);
    } catch (err) {
      console.error('Failed to delete room:', err);
    }
  };

  // Bed Actions
  const handleAssignResidentSubmit = async (payload: AssignResidentPayload) => {
    if (!selectedBedForAssign) return;
    try {
      await assignResidentMutation.mutateAsync({
        bedId: selectedBedForAssign._id,
        tenantData: payload,
      });
      setSelectedBedForAssign(null);
    } catch (err) {
      console.error('Failed to assign resident:', err);
    }
  };

  const handleEditBedSubmit = async (bedId: string, payload: UpdateBedPayload) => {
    try {
      await updateBedMutation.mutateAsync({ bedId, payload });
      setSelectedBedForEdit(null);
    } catch (err) {
      console.error('Failed to update bed:', err);
    }
  };

  const handleVacateBedConfirm = async () => {
    if (!selectedBedForVacate) return;
    try {
      const occupant = (selectedBedForVacate.currentTenant || selectedBedForVacate.tenant) as
        | { _id?: string }
        | undefined;
      await vacateBedMutation.mutateAsync({
        bedId: selectedBedForVacate._id,
        tenantId: occupant?._id,
      });
      setSelectedBedForVacate(null);
    } catch (err) {
      console.error('Failed to vacate bed:', err);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
          <Skeleton className="h-10 w-48 bg-slate-800 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-28 bg-slate-800 rounded-2xl" />
            <Skeleton className="h-28 bg-slate-800 rounded-2xl" />
            <Skeleton className="h-28 bg-slate-800 rounded-2xl" />
            <Skeleton className="h-28 bg-slate-800 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-64 bg-slate-800 rounded-2xl" />
            <Skeleton className="h-64 bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !room) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
          <EmptyState
            title="Room Not Found"
            description="The requested room could not be loaded or may have been deleted."
            actionLabel="Back to Rooms"
            onAction={() => router.push(`/properties/${propertyId}/rooms`)}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-16">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link
            href={`/properties/${propertyId}/rooms`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link
              href={`/properties/${propertyId}`}
              className="hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <Building className="h-3.5 w-3.5" />
              Property
            </Link>
            <span>/</span>
            <Link
              href={`/properties/${propertyId}/rooms`}
              className="hover:text-slate-200 transition-colors"
            >
              Rooms
            </Link>
            <span>/</span>
            <span className="font-semibold text-white">Room {room.roomNumber}</span>
          </div>
        </div>

        {/* Room Header Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
                <BedDouble className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Room {room.roomNumber}
                  </h1>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      isFull
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                        : isVacant
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    {isFull ? 'Full' : isVacant ? 'Vacant' : `${vacantBeds} Beds Open`}
                  </span>
                  <span className="capitalize px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                    {room.shareType} Sharing
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400">
                    {floorDisplay}
                  </span>
                </div>
                <p className="text-sm text-slate-400 flex items-center gap-1.5 pt-1">
                  <IndianRupee className="h-4 w-4 text-emerald-400" />
                  <span className="text-lg font-bold text-white">
                    {formatINR(effectiveRoomRent)}
                  </span>
                  <span className="text-xs text-slate-500">/ bed / month</span>
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                onClick={() => setIsEditRoomOpen(true)}
                className="rounded-xl border-slate-700 bg-slate-800/80 text-slate-200 hover:text-white hover:bg-slate-700/80 flex items-center gap-1.5 h-10 px-4"
              >
                <Edit className="h-4 w-4" />
                Edit Room
              </Button>

              <button
                onClick={() => {
                  if (occupiedBeds > 0) return;
                  if (!confirmDeleteRoom) {
                    setConfirmDeleteRoom(true);
                    setTimeout(() => setConfirmDeleteRoom(false), 3500);
                  } else {
                    handleDeleteRoom();
                  }
                }}
                disabled={occupiedBeds > 0 || deleteRoomMutation.isPending}
                title={
                  occupiedBeds > 0
                    ? 'Cannot delete room with occupied beds'
                    : confirmDeleteRoom
                    ? 'Click again to confirm delete'
                    : 'Delete room'
                }
                className={`flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold border transition-all ${
                  occupiedBeds > 0
                    ? 'border-slate-800 bg-slate-900/50 text-slate-600 cursor-not-allowed'
                    : confirmDeleteRoom
                    ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                    : 'border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/40'
                }`}
              >
                <Trash2 className="h-4 w-4" />
                {confirmDeleteRoom ? 'Confirm Delete' : 'Delete Room'}
              </button>
            </div>
          </div>
        </div>

        {/* ─── 4-Card Metric Row ───────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Beds</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">{totalBeds}</span>
              <BedDouble className="h-5 w-5 text-slate-500" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Capacity for room</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Occupied</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-rose-400">{occupiedBeds}</span>
              <Users className="h-5 w-5 text-rose-400/80" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Current active residents</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Beds</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-400">{vacantBeds}</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-400/80" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Ready for check-in</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Occupancy</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-sky-400">{occupancyRate}%</span>
              <div className="h-3 w-16 bg-slate-800 rounded-full overflow-hidden self-center">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">{occupiedBeds} of {totalBeds} filled</p>
          </div>
        </div>

        {/* ─── Room Amenities & Features ──────────────────────── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Amenities & Room Features
            </h3>
            <span className="text-xs text-slate-500">
              {room.amenities?.length || 0} features configured
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {room.acIncluded && (
              <div className="flex items-center gap-2 rounded-xl bg-sky-500/10 border border-sky-500/20 px-3.5 py-2 text-xs font-semibold text-sky-300">
                <Wind className="h-4 w-4 text-sky-400" />
                Air Conditioning (AC)
              </div>
            )}
            {(room.attachedBathroom || room.bathroomType === 'attached') && (
              <div className="flex items-center gap-2 rounded-xl bg-teal-500/10 border border-teal-500/20 px-3.5 py-2 text-xs font-semibold text-teal-300">
                <Bath className="h-4 w-4 text-teal-400" />
                Attached Bathroom
              </div>
            )}
            {room.hasMeter && (
              <div className="flex items-center gap-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-3.5 py-2 text-xs font-semibold text-yellow-300">
                <Zap className="h-4 w-4 text-yellow-400" />
                Individual Electricity Meter
              </div>
            )}

            {room.amenities?.map((amenity, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 text-xs font-semibold text-slate-200"
              >
                {AMENITY_ICON_MAP[amenity] || <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                {amenity}
              </div>
            ))}

            {!room.acIncluded &&
              !room.attachedBathroom &&
              !room.hasMeter &&
              (!room.amenities || room.amenities.length === 0) && (
                <p className="text-xs text-slate-500 italic">No amenities specified.</p>
              )}
          </div>
        </div>

        {/* ─── Bed Allocation & Residents List ────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Bed Allocation & Inventory
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage individual beds, assign residents, and record check-ins
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> {vacantBeds} Vacant
              </span>
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> {occupiedBeds} Occupied
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {beds.map((bed, idx) => (
              <BedCard
                key={bed._id || idx}
                bed={bed}
                index={idx}
                room={displayRoom || room}
                propertyId={propertyId}
                onAssignClick={(b) => setSelectedBedForAssign(b)}
                onVacateClick={(b) => setSelectedBedForVacate(b)}
                onEditClick={(b) => setSelectedBedForEdit(b)}
              />
            ))}
          </div>
        </div>

        {/* ─── Modals ──────────────────────────────────────────── */}
        {/* Add/Edit Room Modal */}
        <AddEditRoomModal
          open={isEditRoomOpen}
          onOpenChange={setIsEditRoomOpen}
          onSubmit={handleUpdateRoomSubmit}
          isPending={updateRoomMutation.isPending}
          editingRoom={displayRoom || room}
        />

        {/* Assign Resident Modal */}
        <AssignResidentModal
          open={!!selectedBedForAssign}
          onOpenChange={(open) => !open && setSelectedBedForAssign(null)}
          bed={selectedBedForAssign}
          room={displayRoom || room}
          onSubmit={handleAssignResidentSubmit}
          isPending={assignResidentMutation.isPending}
        />

        {/* Edit Bed Modal */}
        <EditBedModal
          open={!!selectedBedForEdit}
          onOpenChange={(open) => !open && setSelectedBedForEdit(null)}
          bed={selectedBedForEdit}
          onSubmit={handleEditBedSubmit}
          isPending={updateBedMutation.isPending}
        />

        {/* Vacate Bed Dialog */}
        <VacateBedDialog
          open={!!selectedBedForVacate}
          onOpenChange={(open) => !open && setSelectedBedForVacate(null)}
          bed={selectedBedForVacate}
          onConfirm={handleVacateBedConfirm}
          isPending={vacateBedMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
