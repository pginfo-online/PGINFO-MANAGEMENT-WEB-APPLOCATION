'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  X,
  BedDouble,
  Building,
  Filter,
  Home,
  ChevronDown,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  usePGRooms,
  useCreateRoom,
  useDeleteRoom,
} from '@/features/rooms/hooks/useRooms';
import { RoomCard } from '@/features/rooms/components/RoomCard';
import { AddEditRoomModal } from '@/features/rooms/components/AddEditRoomModal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import type { CreatePGRoomPayload, Room } from '@/types/property';

export default function RoomsManagementPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;
  const { toast } = useToast();

  // Filter & Search states (matching mobile PropertyScreen)
  const [activeTab, setActiveTab] = useState<'all' | 'vacant' | 'occupied'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<{ id: string; roomNumber: string } | null>(null);

  // Queries
  const { data: dashboardData } = useQuery({
    queryKey: ['property-dashboard', propertyId],
    queryFn: () => dashboardApi.getPropertyDashboard(propertyId),
    enabled: !!propertyId,
  });
  const property = dashboardData?.data?.property;

  const {
    data: roomsData,
    isLoading,
  } = usePGRooms(propertyId);

  const createRoomMutation = useCreateRoom(propertyId);
  const deleteRoomMutation = useDeleteRoom(propertyId);

  const allRooms: Room[] = useMemo(() => {
    return roomsData?.rooms || [];
  }, [roomsData]);

  // Derived Stats (matching mobile 2-Card Metrics Row)
  const stats = useMemo(() => {
    if (roomsData?.stats) return roomsData.stats;

    const totalBeds = allRooms.reduce(
      (acc, r) => acc + (r.totalBeds || r.beds?.length || 0),
      0
    );
    const occupiedBeds = allRooms.reduce((acc, r) => {
      const occ = (r.beds || []).filter(
        (b) => b.status === 'occupied' || (b as unknown as { isOccupied?: boolean }).isOccupied
      ).length;
      return acc + (r.occupiedBeds ?? occ);
    }, 0);
    const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupiedRooms = allRooms.filter((r) => {
      const cap = r.totalBeds || r.beds?.length || 1;
      const occ =
        r.occupiedBeds ??
        (r.beds || []).filter(
          (b) => b.status === 'occupied' || (b as unknown as { isOccupied?: boolean }).isOccupied
        ).length;
      return occ >= cap && cap > 0;
    }).length;
    const vacantRooms = allRooms.filter((r) => {
      const occ =
        r.occupiedBeds ??
        (r.beds || []).filter(
          (b) => b.status === 'occupied' || (b as unknown as { isOccupied?: boolean }).isOccupied
        ).length;
      return occ === 0;
    }).length;

    return {
      totalRooms: allRooms.length,
      occupiedRooms,
      vacantRooms,
      partialRooms: allRooms.length - occupiedRooms - vacantRooms,
      totalBeds,
      occupiedBeds,
      vacantBeds,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    };
  }, [roomsData, allRooms]);

  // Client-Side Instantaneous Filtering (matching mobile's 0ms transitions)
  const filteredRooms = useMemo(() => {
    let list = allRooms;

    // Status filter
    if (activeTab === 'vacant') {
      list = list.filter((r) => {
        const beds = r.beds || [];
        const cap = Number(r.totalBeds || beds.length || 1);
        const occ =
          r.occupiedBeds ??
          beds.filter(
            (b) => b.status === 'occupied' || (b as unknown as { isOccupied?: boolean }).isOccupied
          ).length;
        const vacantBeds = Math.max(0, cap - occ);
        return vacantBeds > 0;
      });
    } else if (activeTab === 'occupied') {
      list = list.filter((r) => {
        const beds = r.beds || [];
        const cap = Number(r.totalBeds || beds.length || 1);
        const occ =
          r.occupiedBeds ??
          beds.filter(
            (b) => b.status === 'occupied' || (b as unknown as { isOccupied?: boolean }).isOccupied
          ).length;
        return occ >= cap && cap > 0;
      });
    }

    // Floor filter
    if (selectedFloor !== 'all') {
      list = list.filter((r) => {
        const floorObjName = typeof r.floor === 'object' && r.floor ? r.floor.name : undefined;
        return (
          String(r.floorLabel || '').toLowerCase() === selectedFloor.toLowerCase() ||
          String(floorObjName || '').toLowerCase() === selectedFloor.toLowerCase()
        );
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const num = String(r.roomNumber || '').toLowerCase();
        const floorObjName = typeof r.floor === 'object' && r.floor ? r.floor.name : undefined;
        const floor = String(r.floorLabel || floorObjName || '').toLowerCase();
        const share = String(r.shareType || '').toLowerCase();
        return num.includes(q) || floor.includes(q) || share.includes(q);
      });
    }

    return list;
  }, [allRooms, activeTab, selectedFloor, searchQuery]);

  // Unique floors available for filtering
  const availableFloors = useMemo(() => {
    const floorsSet = new Set<string>();
    allRooms.forEach((r) => {
      if (r.floorLabel) floorsSet.add(r.floorLabel);
      else if (typeof r.floor === 'object' && r.floor?.name) floorsSet.add(r.floor.name);
    });
    return Array.from(floorsSet);
  }, [allRooms]);

  // Handlers
  const handleCreateRoom = async (payload: CreatePGRoomPayload) => {
    try {
      await createRoomMutation.mutateAsync(payload);
      toast.success(
        'Room created successfully',
        `Room ${payload.roomNumber} with ${payload.totalBeds} bed(s) has been added.`
      );
      setIsAddRoomOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create room';
      toast.error('Failed to create room', msg);
    }
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    try {
      await deleteRoomMutation.mutateAsync(roomToDelete.id);
      toast.success(
        'Room deleted',
        `Room ${roomToDelete.roomNumber} and its beds have been removed.`
      );
      setRoomToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete room';
      toast.error('Failed to delete room', msg);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* ─── Breadcrumb & Top Bar ────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Link
                href="/dashboard"
                className="hover:text-[var(--text-main)] transition-colors flex items-center gap-1"
              >
                <Home className="h-3.5 w-3.5" />
                Dashboard
              </Link>
              <span>/</span>
              <Link
                href={`/properties/${propertyId}`}
                className="hover:text-[var(--text-main)] transition-colors flex items-center gap-1"
              >
                <Building className="h-3.5 w-3.5" />
                {property?.name || 'Property'}
              </Link>
              <span>/</span>
              <span className="font-semibold text-[var(--text-main)]">Rooms & Beds</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-3">
              <BedDouble className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              Rooms & Beds
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
              Manage inventory, bed allocations, and monitor real-time occupancy.
            </p>
          </div>

          {/* Add Room Primary CTA */}
          <Button
            onClick={() => setIsAddRoomOpen(true)}
            className="btn-gold-primary rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto h-11 px-5"
          >
            <Plus className="h-4 w-4" />
            Add Room
          </Button>
        </div>

        {/* ─── 2-Card Metrics Row ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Card: Vacant Room & Room Full */}
          <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-main)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Room Status
              </span>
              <span className="text-xs text-[var(--text-muted)] font-medium">
                {stats.totalRooms} Total Rooms
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              {/* Vacant Room Pill */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50/70 dark:bg-emerald-500/10">
                <div>
                  <p className="text-xs font-bold text-emerald-800 dark:text-[var(--text-main)]">Vacant Room</p>
                  <p className="text-[11px] text-emerald-700/80 dark:text-[var(--text-muted)] mt-0.5">Ready for booking</p>
                </div>
                <div className="flex h-9 min-w-9 px-2.5 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-base shadow-sm dark:bg-emerald-500/20 dark:text-emerald-300">
                  {stats.vacantRooms}
                </div>
              </div>

              {/* Room Full Pill */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-rose-200 dark:border-rose-500/25 bg-rose-50/70 dark:bg-rose-500/10">
                <div>
                  <p className="text-xs font-bold text-rose-800 dark:text-[var(--text-main)]">Room Full</p>
                  <p className="text-[11px] text-rose-700/80 dark:text-[var(--text-muted)] mt-0.5">100% Occupied</p>
                </div>
                <div className="flex h-9 min-w-9 px-2.5 items-center justify-center rounded-xl bg-rose-600 text-white font-black text-base shadow-sm dark:bg-rose-500/20 dark:text-rose-300">
                  {stats.occupiedRooms}
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Beds Vacant & Occupancy Rate */}
          <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-main)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Bed Capacity
              </span>
              <span className="text-xs text-[var(--text-muted)] font-medium">
                {stats.totalBeds} Total Beds
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              {/* Beds Vacant Pill */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50/70 dark:bg-emerald-500/10">
                <div>
                  <p className="text-xs font-bold text-emerald-800 dark:text-[var(--text-main)]">Beds Vacant</p>
                  <p className="text-[11px] text-emerald-700/80 dark:text-[var(--text-muted)] mt-0.5">Available beds</p>
                </div>
                <div className="flex h-9 min-w-9 px-2.5 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-base shadow-sm dark:bg-emerald-500/20 dark:text-emerald-300">
                  {stats.vacantBeds}
                </div>
              </div>

              {/* Occupancy Pill with Progress */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-sky-200 dark:border-sky-500/25 bg-sky-50/70 dark:bg-sky-500/10">
                <div>
                  <p className="text-xs font-bold text-sky-800 dark:text-[var(--text-main)]">Occupancy</p>
                  <div className="w-16 h-1.5 bg-sky-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden border border-sky-200/60 dark:border-transparent">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-500"
                      style={{ width: `${stats.occupancyRate}%` }}
                    />
                  </div>
                </div>
                <div className="flex h-9 min-w-9 px-2.5 items-center justify-center rounded-xl bg-sky-600 text-white font-black text-base shadow-sm dark:bg-sky-500/20 dark:text-sky-300">
                  {stats.occupancyRate}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Controls: Search & Segmented Filters ────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          {/* Segmented Filter Control */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-sm self-start">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-[var(--bg-card-subtle)] text-[var(--text-main)] border border-[var(--border-main)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              All Rooms ({allRooms.length})
            </button>
            <button
              onClick={() => setActiveTab('vacant')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'vacant'
                  ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 shadow-sm dark:text-emerald-300'
                  : 'text-[var(--text-muted)] hover:text-emerald-600 dark:hover:text-emerald-300'
              }`}
            >
              Vacant
            </button>
            <button
              onClick={() => setActiveTab('occupied')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'occupied'
                  ? 'bg-rose-500/15 text-rose-800 border border-rose-500/30 shadow-sm dark:text-rose-300'
                  : 'text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-300'
              }`}
            >
              Occupied
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Floor Filter */}
            {availableFloors.length > 0 && (
              <div className="relative">
                <select
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  className="appearance-none bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] text-xs font-medium rounded-xl pl-3.5 pr-8 py-2.5 focus:outline-none focus:ring-1 focus:ring-[var(--gold)] cursor-pointer shadow-sm"
                >
                  <option value="all">All Floors</option>
                  {availableFloors.map((floor) => (
                    <option key={floor} value={floor}>
                      {floor.charAt(0).toUpperCase() + floor.slice(1)} Floor
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
              </div>
            )}

            {/* Pill Search Bar */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
              <Input
                placeholder="Search room, floor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-10 rounded-xl bg-[var(--bg-card)] border-[var(--border-main)] text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--gold)] shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Rooms Grid ───────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 bg-slate-800/60 rounded-2xl" />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-12 text-center">
            {allRooms.length === 0 ? (
              <EmptyState
                title="No Rooms Added Yet"
                description="Get started by configuring your first room and bed inventory for this property."
                actionLabel="Add First Room"
                onAction={() => setIsAddRoomOpen(true)}
              />
            ) : (
              <div className="max-w-md mx-auto space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-400 mx-auto">
                  <Filter className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">No Matching Rooms</h3>
                <p className="text-xs text-slate-400">
                  No rooms match your search query &ldquo;{searchQuery}&rdquo; or filter settings.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveTab('all');
                    setSelectedFloor('all');
                    setSearchQuery('');
                  }}
                  className="rounded-xl border-slate-700 text-slate-300 hover:text-white mt-2"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room._id}
                room={room}
                propertyId={propertyId}
                onDelete={(id, roomNum) => setRoomToDelete({ id, roomNumber: roomNum })}
                deleting={deleteRoomMutation.isPending && roomToDelete?.id === room._id}
              />
            ))}
          </div>
        )}

        {/* ─── Modals ───────────────────────────────────────────── */}
        <AddEditRoomModal
          open={isAddRoomOpen}
          onOpenChange={setIsAddRoomOpen}
          onSubmit={handleCreateRoom}
          isPending={createRoomMutation.isPending}
        />

        {/* Confirm Delete Room Dialog */}
        <ConfirmDialog
          open={!!roomToDelete}
          onOpenChange={(open) => !open && setRoomToDelete(null)}
          title={`Delete Room ${roomToDelete?.roomNumber}?`}
          description="Are you sure you want to delete this room and its bed inventory? This action cannot be undone."
          confirmText="Delete Room"
          variant="danger"
          isPending={deleteRoomMutation.isPending}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </DashboardLayout>
  );
}
