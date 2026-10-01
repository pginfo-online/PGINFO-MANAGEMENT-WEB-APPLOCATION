'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  Camera,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { ImageUpload } from '@/components/ui/image-upload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatINR } from '@/lib/utils';
import {
  useRoomDetail,
  useUpdateRoom,
  useDeleteRoom,
  useUpdateBed,
  useAssignResident,
  useVacateBed,
  useUploadRoomPhoto,
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
  const { toast } = useToast();

  // Modals state
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedBedForAssign, setSelectedBedForAssign] = useState<Bed | null>(null);
  const [selectedBedForEdit, setSelectedBedForEdit] = useState<Bed | null>(null);
  const [selectedBedForVacate, setSelectedBedForVacate] = useState<Bed | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string>('');

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
  const uploadRoomPhotoMutation = useUploadRoomPhoto(propertyId, roomId);

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
          depositAmount: payload.depositAmount,
          roomSize: payload.roomSize,
          notes: payload.notes,
          ac: payload.ac,
          acIncluded: payload.acIncluded,
          attachedBathroom: payload.attachedBathroom,
          bathroomType: payload.bathroomType,
          amenities: payload.amenities,
          image: payload.image,
        },
      });
      toast.success('Room updated', `Room ${payload.roomNumber} details updated successfully.`);
      setIsEditRoomOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update room';
      toast.error('Failed to update room', msg);
    }
  };

  const handleDeleteRoom = async () => {
    if (occupiedBeds > 0) return;
    try {
      await deleteRoomMutation.mutateAsync(roomId);
      toast.success('Room deleted', `Room ${room?.roomNumber} has been removed.`);
      router.push(`/properties/${propertyId}/rooms`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete room';
      toast.error('Failed to delete room', msg);
    }
  };

  const handleSavePhoto = async () => {
    if (!pendingPhotoUrl) return;
    try {
      await uploadRoomPhotoMutation.mutateAsync({ image: pendingPhotoUrl });
      toast.success('Room photo updated', 'New room image saved successfully.');
      setIsPhotoModalOpen(false);
      setPendingPhotoUrl('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update photo';
      toast.error('Failed to update room photo', msg);
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
      toast.success(
        'Resident assigned',
        `${payload.name} has been assigned to ${selectedBedForAssign.bedLabel || 'bed'}.`
      );
      setSelectedBedForAssign(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign resident';
      toast.error('Failed to assign resident', msg);
    }
  };

  const handleEditBedSubmit = async (bedId: string, payload: UpdateBedPayload) => {
    try {
      await updateBedMutation.mutateAsync({ bedId, payload });
      toast.success('Bed updated', 'Bed details and pricing updated successfully.');
      setSelectedBedForEdit(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update bed';
      toast.error('Failed to update bed', msg);
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
      toast.success('Bed vacated', 'Bed is now vacant and ready for new residents.');
      setSelectedBedForVacate(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to vacate bed';
      toast.error('Failed to vacate bed', msg);
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
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-main)] bg-white dark:bg-slate-900/80 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)] dark:border-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:border-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] dark:text-slate-400">
            <Link
              href={`/properties/${propertyId}`}
              className="hover:text-[var(--text-main)] dark:hover:text-slate-200 transition-colors flex items-center gap-1 font-medium"
            >
              <Building className="h-3.5 w-3.5" />
              Property
            </Link>
            <span>/</span>
            <Link
              href={`/properties/${propertyId}/rooms`}
              className="hover:text-[var(--text-main)] dark:hover:text-slate-200 transition-colors font-medium"
            >
              Rooms
            </Link>
            <span>/</span>
            <span className="font-bold text-[var(--text-main)] dark:text-white">Room {room.roomNumber}</span>
          </div>
        </div>

        {/* Room Header Hero */}
        <div className="relative overflow-hidden rounded-3xl border theme-hero-card p-6 sm:p-8 backdrop-blur-xl shadow-md">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gold-pale)] border border-[var(--gold-light)] text-[var(--gold-strong)] dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 shadow-sm">
                <BedDouble className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] dark:text-white tracking-tight">
                    Room {room.roomNumber}
                  </h1>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      isFull
                        ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300'
                        : isVacant
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300'
                        : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300'
                    }`}
                  >
                    {isFull ? 'Full' : isVacant ? 'Vacant' : `${vacantBeds} Beds Open`}
                  </span>
                  <span className="capitalize px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-[var(--border-main)] dark:border-slate-700 text-[var(--text-main)] dark:text-slate-300 shadow-sm">
                    {room.shareType} Sharing
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-[var(--border-main)] dark:border-slate-700 text-[var(--text-muted)] dark:text-slate-400 shadow-sm">
                    {floorDisplay}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-muted)] dark:text-slate-400 flex items-center gap-1.5 pt-1">
                  <IndianRupee className="h-4 w-4 text-[var(--gold-strong)] dark:text-emerald-400" />
                  <span className="text-lg font-black text-[var(--text-main)] dark:text-white">
                    {formatINR(effectiveRoomRent)}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] dark:text-slate-500">/ bed / month</span>
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                onClick={() => {
                  setPendingPhotoUrl(room.image || '');
                  setIsPhotoModalOpen(true);
                }}
                className="rounded-xl border-[var(--border-main)] dark:border-slate-700 bg-white dark:bg-slate-800/80 text-[var(--text-main)] dark:text-slate-200 hover:bg-[var(--bg-card-subtle)] dark:hover:text-white dark:hover:bg-slate-700/80 flex items-center gap-1.5 h-10 px-4 shadow-sm"
              >
                <Camera className="h-4 w-4 text-[var(--gold)] dark:text-emerald-400" />
                {room.image ? 'Change Photo' : 'Add Photo'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsEditRoomOpen(true)}
                className="rounded-xl border-[var(--border-main)] dark:border-slate-700 bg-white dark:bg-slate-800/80 text-[var(--text-main)] dark:text-slate-200 hover:bg-[var(--bg-card-subtle)] dark:hover:text-white dark:hover:bg-slate-700/80 flex items-center gap-1.5 h-10 px-4 shadow-sm"
              >
                <Edit className="h-4 w-4 text-[var(--gold)] dark:text-emerald-400" />
                Edit Room
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={occupiedBeds > 0 || deleteRoomMutation.isPending}
                title={
                  occupiedBeds > 0
                    ? 'Cannot delete room with occupied beds'
                    : 'Delete room'
                }
                className={`flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold border transition-all ${
                  occupiedBeds > 0
                    ? 'border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-600 cursor-not-allowed opacity-40'
                    : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20 shadow-sm'
                }`}
              >
                <Trash2 className="h-4 w-4" />
                Delete Room
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Room Photo Banner (if available) ──────────────────── */}
        {room.image && (
          <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-3xl border border-[var(--border-main)] dark:border-slate-800 bg-slate-950 shadow-md">
            <Image
              src={room.image}
              alt={`Room ${room.roomNumber}`}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
              <span className="text-xs font-semibold text-white bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                Room Photo
              </span>
              <button
                onClick={() => {
                  setPendingPhotoUrl(room.image || '');
                  setIsPhotoModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 hover:bg-black/80 transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
                Update Photo
              </button>
            </div>
          </div>
        )}

        {/* ─── 4-Card Metric Row ───────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[var(--border-main)] bg-white dark:bg-slate-900/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] dark:text-slate-400">Total Beds</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-[var(--text-main)] dark:text-white">{totalBeds}</span>
              <BedDouble className="h-5 w-5 text-[var(--text-muted)] dark:text-slate-500" />
            </div>
            <p className="text-xs text-[var(--text-muted)] dark:text-slate-500 mt-1">Capacity for room</p>
          </div>

          <div className="rounded-2xl border border-[var(--border-main)] bg-white dark:bg-slate-900/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] dark:text-slate-400">Occupied</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-rose-600 dark:text-rose-400">{occupiedBeds}</span>
              <Users className="h-5 w-5 text-rose-500 dark:text-rose-400/80" />
            </div>
            <p className="text-xs text-[var(--text-muted)] dark:text-slate-500 mt-1">Current active residents</p>
          </div>

          <div className="rounded-2xl border border-[var(--border-main)] bg-white dark:bg-slate-900/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] dark:text-slate-400">Available Beds</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{vacantBeds}</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400/80" />
            </div>
            <p className="text-xs text-[var(--text-muted)] dark:text-slate-500 mt-1">Ready for check-in</p>
          </div>

          <div className="rounded-2xl border border-[var(--border-main)] bg-white dark:bg-slate-900/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] dark:text-slate-400">Occupancy</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-sky-600 dark:text-sky-400">{occupancyRate}%</span>
              <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden self-center border border-slate-200 dark:border-transparent">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] dark:text-slate-500 mt-1">{occupiedBeds} of {totalBeds} filled</p>
          </div>
        </div>

        {/* ─── Room Amenities & Features ──────────────────────── */}
        <div className="rounded-2xl border border-[var(--border-main)] bg-white dark:bg-slate-900/60 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] dark:text-slate-300">
              Amenities & Room Features
            </h3>
            <span className="text-xs text-[var(--text-muted)] dark:text-slate-500">
              {room.amenities?.length || 0} features configured
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {room.acIncluded && (
              <div className="flex items-center gap-2 rounded-xl bg-sky-50 border border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/20 px-3.5 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300">
                <Wind className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                Air Conditioning (AC)
              </div>
            )}
            {(room.attachedBathroom || room.bathroomType === 'attached') && (
              <div className="flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200 dark:bg-teal-500/10 dark:border-teal-500/20 px-3.5 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300">
                <Bath className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Attached Bathroom
              </div>
            )}
            {room.hasMeter && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 dark:bg-yellow-500/10 dark:border-yellow-500/20 px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-yellow-300">
                <Zap className="h-4 w-4 text-amber-600 dark:text-yellow-400" />
                Individual Electricity Meter
              </div>
            )}

            {room.amenities?.map((amenity, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-main)] dark:bg-slate-800/80 dark:border-slate-700/80 px-3.5 py-2 text-xs font-semibold text-[var(--text-main)] dark:text-slate-200 shadow-sm"
              >
                {AMENITY_ICON_MAP[amenity] || <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                {amenity}
              </div>
            ))}

            {!room.acIncluded &&
              !room.attachedBathroom &&
              !room.hasMeter &&
              (!room.amenities || room.amenities.length === 0) && (
                <p className="text-xs text-[var(--text-muted)] dark:text-slate-500 italic">No amenities specified.</p>
              )}
          </div>
        </div>

        {/* ─── Bed Allocation & Residents List ────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)] dark:text-white tracking-tight flex items-center gap-2">
                Bed Allocation & Inventory
              </h3>
              <p className="text-xs text-[var(--text-muted)] dark:text-slate-400 mt-0.5">
                Manage individual beds, assign residents, and record check-ins
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> {vacantBeds} Vacant
              </span>
              <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> {occupiedBeds} Occupied
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

        {/* Photo Upload Modal */}
        <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-emerald-400" />
                {room.image ? 'Change Room Photo' : 'Upload Room Photo'}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-4">
              <p className="text-xs text-slate-400">
                Upload a photo of Room {room.roomNumber} for your records and tenant listings.
              </p>
              <ImageUpload
                value={pendingPhotoUrl}
                onChange={(url) => setPendingPhotoUrl(url)}
                onRemove={() => setPendingPhotoUrl('')}
                label="Room Image"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsPhotoModalOpen(false)}
                disabled={uploadRoomPhotoMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePhoto}
                disabled={!pendingPhotoUrl || uploadRoomPhotoMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {uploadRoomPhotoMutation.isPending ? 'Saving...' : 'Save Photo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Room Confirmation Dialog */}
        <ConfirmDialog
          open={isDeleteConfirmOpen}
          onOpenChange={setIsDeleteConfirmOpen}
          title={`Delete Room ${room.roomNumber}?`}
          description="Are you sure you want to delete this room and all its bed inventory? This action cannot be undone."
          confirmText="Delete Room"
          variant="danger"
          isPending={deleteRoomMutation.isPending}
          onConfirm={handleDeleteRoom}
        />
      </div>
    </DashboardLayout>
  );
}
