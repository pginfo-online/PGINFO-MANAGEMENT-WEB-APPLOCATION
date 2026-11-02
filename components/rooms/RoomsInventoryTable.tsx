"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Bed,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Sparkles,
  ClipboardList,
  Calendar,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  UserPlus,
  Share2,
  Edit,
  Ban,
  EyeOff,
  Trash2,
  Info,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
} from "lucide-react";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatINR, cn } from "@/lib/utils";
import { toast } from "sonner";
import ChooseBedsModal from "@/components/drawers/ChooseBedsModal";
import RoomDrawer from "@/components/drawers/RoomDrawer";

interface RoomFilterState {
  search: string;
  floor: string;
  typeTag: string;
  vacancyType: string;
  status: string;
  sharingType: string;
  unitType: string;
  kpiFilter: string | null;
}

export default function RoomsInventoryTable() {
  const queryClient = useQueryClient();
  const { selectedPropertyId } = usePropertyStore();
  const { setAddRoomOpen, setEditRoomOpen } = useUiStore();

  // Collapsible Overview Cards state
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("ALL");
  const [typeTagFilter, setTypeTagFilter] = useState("ALL");
  const [vacancyFilter, setVacancyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sharingFilter, setSharingFilter] = useState("ALL");
  const [unitTypeFilter, setUnitTypeFilter] = useState("ALL");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<"roomNumber" | "occupancy" | "rentAmount">("roomNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Drawers and Modals state
  const [selectedRoomForDrawer, setSelectedRoomForDrawer] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRoomForChooseBeds, setSelectedRoomForChooseBeds] = useState<any | null>(null);
  const [isChooseBedsOpen, setIsChooseBedsOpen] = useState(false);
  const [activeMenuRoomId, setActiveMenuRoomId] = useState<string | null>(null);

  // Load Properties
  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => api.properties.list(),
  });

  const properties = propertiesData?.data || [];
  const propertyId = selectedPropertyId || (properties[0]?.id ?? "");

  // Load Rooms for property
  const { data: rooms, isLoading: isRoomsLoading } = useQuery({
    queryKey: ["rooms", propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      return api.rooms.listByProperty(propertyId);
    },
    enabled: !!propertyId,
  });

  // Load 17-point Inventory Stats from backend
  const { data: statsData } = useQuery({
    queryKey: ["inventoryStats", propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      return api.rooms.inventoryStats(propertyId);
    },
    enabled: !!propertyId,
  });

  const roomList = rooms || [];

  // Mutations for table actions
  const disableRentMutation = useMutation({
    mutationFn: (rId: string) => api.rooms.toggleDisableRent(rId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
      toast.success(
        updated.isDisabledForRent
          ? `Room ${updated.roomNumber} disabled for rent`
          : `Room ${updated.roomNumber} enabled for rent`
      );
      setActiveMenuRoomId(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update"),
  });

  const publishMutation = useMutation({
    mutationFn: (rId: string) => api.rooms.togglePublish(rId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(
        updated.isPublished
          ? `Room ${updated.roomNumber} published to listings`
          : `Room ${updated.roomNumber} unpublished from listings`
      );
      setActiveMenuRoomId(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to toggle publication"),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (rId: string) => api.rooms.delete(rId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
      toast.success("Room deleted successfully");
      setActiveMenuRoomId(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete room"),
  });

  // Keyboard shortcut for Cmd+F or Ctrl+F to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const searchInput = document.getElementById("room-search-input");
        searchInput?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute distinct floors from room list
  const distinctFloors = useMemo(() => {
    const set = new Set<string>();
    roomList.forEach((r) => {
      if (r.floor) set.add(r.floor);
    });
    return Array.from(set).sort();
  }, [roomList]);

  // Client-side fallback stats calculation if backend is computing
  const computedStats = useMemo(() => {
    if (statsData) return statsData;

    let totalBeds = 0;
    let vacantRooms = 0;
    let semiVacantRooms = 0;
    let vacantBeds = 0;
    let overbookedRooms = 0;
    let overbookedBeds = 0;
    let occupiedRooms = 0;
    let occupiedBeds = 0;
    let underNoticeTenants = 0;
    let unverifiedRooms = 0;
    let maleRooms = 0;
    let femaleRooms = 0;
    let underNoticeWithBooking = 0;
    let disabledForRent = 0;
    let disabledForRentBeds = 0;

    roomList.forEach((room: any) => {
      if (room.isDisabledForRent) disabledForRent++;
      if (room.isVerified === false) unverifiedRooms++;
      if (room.gender === "MALE") maleRooms++;
      if (room.gender === "FEMALE") femaleRooms++;

      const bList = room.beds || [];
      totalBeds += bList.length;

      let roomOcc = 0;
      let roomBookings = 0;

      bList.forEach((bed: any) => {
        const isBedDisabled = bed.isDisabledForRent || room.isDisabledForRent;
        if (isBedDisabled) disabledForRentBeds++;

        const activeRes = (bed.residents || []).filter((r: any) => r.status === "ACTIVE");
        const noticeRes = (bed.residents || []).filter((r: any) => r.status === "NOTICE_PERIOD");
        const totalRes = activeRes.length + noticeRes.length;
        const totalBk = (bed.bookings || []).length;

        underNoticeTenants += noticeRes.length;
        if (noticeRes.length > 0 && totalBk > 0) underNoticeWithBooking++;

        if (totalRes > 0) {
          occupiedBeds += totalRes;
          roomOcc += totalRes;
        } else if (!isBedDisabled && bed.status === "AVAILABLE" && totalBk === 0) {
          vacantBeds++;
        }

        if (totalRes > 1 || (totalRes >= 1 && totalBk > 0)) {
          overbookedBeds++;
        }
        roomBookings += totalBk;
      });

      if (roomOcc > 0) occupiedRooms++;
      if (bList.length > 0 && roomOcc === 0 && !room.isDisabledForRent) vacantRooms++;
      else if (roomOcc > 0 && roomOcc < bList.length) semiVacantRooms++;

      if (roomOcc + roomBookings > bList.length && bList.length > 0) overbookedRooms++;
    });

    return {
      totalRooms: roomList.length,
      totalBeds,
      vacantRooms,
      semiVacantRooms,
      vacantBeds,
      overbookedRooms,
      overbookedBeds,
      occupiedRooms,
      occupiedBeds,
      newBookings: 0,
      underNoticeTenants,
      unverifiedRooms,
      maleRooms,
      femaleRooms,
      underNoticeWithBooking,
      disabledForRent,
      disabledForRentBeds,
    };
  }, [statsData, roomList]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return roomList.filter((room: any) => {
      // Floor filter
      if (floorFilter !== "ALL" && room.floor !== floorFilter) {
        return false;
      }

      // Search filter (room number or floor or sharing or remarks)
      if (search.trim()) {
        const s = search.toLowerCase();
        const matchesRoom = room.roomNumber.toLowerCase().includes(s);
        const matchesSharing = room.sharingType?.toLowerCase().includes(s);
        const matchesFloor = room.floor?.toLowerCase().includes(s);
        const matchesRemarks = room.remarks?.toLowerCase().includes(s);
        if (!matchesRoom && !matchesSharing && !matchesFloor && !matchesRemarks) {
          return false;
        }
      }

      // Type Tags
      if (typeTagFilter !== "ALL") {
        if ((room.unitType || "Room") !== typeTagFilter) return false;
      }

      // Vacancy Type
      const bList = room.beds || [];
      const occCount = bList.filter(
        (b: any) =>
          b.status === "OCCUPIED" ||
          b.status === "RESERVED" ||
          (b.residents && b.residents.length > 0)
      ).length;

      if (vacancyFilter === "VACANT" && occCount > 0) return false;
      if (vacancyFilter === "SEMI_VACANT" && (occCount === 0 || occCount >= bList.length)) {
        return false;
      }
      if (vacancyFilter === "OCCUPIED" && occCount < bList.length) return false;

      // Status Filter
      if (statusFilter === "ACTIVE" && room.isDisabledForRent) return false;
      if (statusFilter === "DISABLED" && !room.isDisabledForRent) return false;
      if (statusFilter === "UNPUBLISHED" && room.isPublished) return false;

      // Sharing Type
      if (sharingFilter !== "ALL" && room.sharingType !== sharingFilter) {
        return false;
      }

      // Unit Type
      if (unitTypeFilter !== "ALL" && (room.unitType || "Room") !== unitTypeFilter) {
        return false;
      }

      // KPI Card Filter
      if (kpiFilter) {
        switch (kpiFilter) {
          case "vacantRooms":
            if (occCount > 0 || room.isDisabledForRent) return false;
            break;
          case "semiVacantRooms":
            if (occCount === 0 || occCount >= bList.length) return false;
            break;
          case "occupiedRooms":
            if (occCount === 0) return false;
            break;
          case "overbookedRooms":
            if (occCount <= bList.length) return false;
            break;
          case "maleRooms":
            if (room.gender !== "MALE") return false;
            break;
          case "femaleRooms":
            if (room.gender !== "FEMALE") return false;
            break;
          case "disabledForRent":
            if (!room.isDisabledForRent) return false;
            break;
          case "unverifiedRooms":
            if (room.isVerified !== false) return false;
            break;
          default:
            break;
        }
      }

      return true;
    });
  }, [
    roomList,
    floorFilter,
    search,
    typeTagFilter,
    vacancyFilter,
    statusFilter,
    sharingFilter,
    unitTypeFilter,
    kpiFilter,
  ]);

  // Group rooms by floor or section matching ref-1 & video
  const groupedRooms = useMemo(() => {
    const groups: { label: string; rooms: any[] }[] = [];
    const floorMap = new Map<string, any[]>();

    filteredRooms.forEach((r: any) => {
      const f = r.floor || "Ground Floor";
      if (!floorMap.has(f)) {
        floorMap.set(f, []);
      }
      floorMap.get(f)!.push(r);
    });

    floorMap.forEach((roomsOnFloor, floorName) => {
      groups.push({
        label: floorName,
        rooms: roomsOnFloor,
      });
    });

    return groups;
  }, [filteredRooms]);

  // Sort toggle handler
  const handleSort = (field: "roomNumber" | "occupancy" | "rentAmount") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleShareRoom = (room: any) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/property/rooms/${room.id}`);
      toast.success(`Link for Room ${room.roomNumber} copied to clipboard!`);
    }
    setActiveMenuRoomId(null);
  };

  // 17 Statistics Cards Definition matching user prompt & images
  const statCards = [
    {
      key: "totalRooms",
      value: computedStats.totalRooms,
      label: "Total Rooms",
      color: "text-blue-600",
    },
    {
      key: "totalBeds",
      value: computedStats.totalBeds,
      label: "Total Beds",
      color: "text-amber-500",
    },
    {
      key: "vacantRooms",
      value: computedStats.vacantRooms,
      label: "Vacant Rooms",
      color: "text-rose-500",
    },
    {
      key: "semiVacantRooms",
      value: computedStats.semiVacantRooms,
      label: "Semi Vacant Rooms",
      color: "text-amber-500",
    },
    {
      key: "vacantBeds",
      value: computedStats.vacantBeds,
      label: "Vacant Beds",
      color: "text-blue-600",
    },
    {
      key: "overbookedRooms",
      value: computedStats.overbookedRooms,
      label: "Overbooked Rooms",
      color: "text-rose-600",
    },
    {
      key: "overbookedBeds",
      value: computedStats.overbookedBeds,
      label: "Overbooked Beds",
      color: "text-rose-600",
    },
    {
      key: "occupiedRooms",
      value: computedStats.occupiedRooms,
      label: "Occupied Rooms",
      color: "text-emerald-600",
    },
    {
      key: "occupiedBeds",
      value: computedStats.occupiedBeds,
      label: "Occupied Beds",
      color: "text-emerald-600",
    },
    {
      key: "newBookings",
      value: computedStats.newBookings,
      label: "New Bookings",
      color: "text-indigo-600",
    },
    {
      key: "underNoticeTenants",
      value: computedStats.underNoticeTenants,
      label: "Under Notice Tenants",
      color: "text-amber-600",
    },
    {
      key: "unverifiedRooms",
      value: computedStats.unverifiedRooms,
      label: "Unverified Rooms",
      color: "text-slate-500",
    },
    {
      key: "maleRooms",
      value: computedStats.maleRooms,
      label: "Male Rooms",
      color: "text-blue-500",
    },
    {
      key: "femaleRooms",
      value: computedStats.femaleRooms,
      label: "Female Rooms",
      color: "text-pink-500",
    },
    {
      key: "underNoticeWithBooking",
      value: computedStats.underNoticeWithBooking,
      label: "Under Notice with Booking",
      color: "text-purple-600",
    },
    {
      key: "disabledForRent",
      value: computedStats.disabledForRent,
      label: "Disabled for Rent",
      color: "text-slate-400",
    },
    {
      key: "disabledForRentBeds",
      value: computedStats.disabledForRentBeds,
      label: "Disabled for Rent Beds",
      color: "text-slate-400",
    },
  ];

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* 1. Header Bar matching ref-1 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Title & Collapsible Rooms Overview toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
            className="flex items-center gap-2 text-2xl font-bold text-slate-900 tracking-tight hover:text-blue-600 transition cursor-pointer select-none group"
          >
            <span>Rooms Overview</span>
            <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
              {isOverviewExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </button>
        </div>

        {/* Right Header: Search & Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Search Room Input with ⌘F Badge */}
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="room-search-input"
              type="text"
              placeholder="Search room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl bg-white border border-slate-200 pl-9 pr-14 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2F54EB] shadow-xs"
            />
            <div className="absolute right-2.5 top-2 flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md pointer-events-none border border-slate-200">
              <span>⌘</span>
              <span>F</span>
            </div>
          </div>

          {/* Cleaning Checklist Button */}
          <button
            onClick={() => toast.info("Cleaning Checklist viewer opened")}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
          >
            <span>Cleaning Checklist</span>
          </button>

          {/* Timeline Button */}
          <Link
            href="/property/bed-availability"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#2F54EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer shrink-0"
          >
            <span>Timeline</span>
          </Link>

          {/* Add Room Button */}
          <button
            onClick={() => setAddRoomOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Room</span>
          </button>
        </div>
      </div>

      {/* 2. Collapsible Statistics Cards matching ref-1 & video frame 26 */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOverviewExpanded
            ? "max-h-[500px] opacity-100"
            : "max-h-0 opacity-0 pointer-events-none m-0"
        )}
      >
        <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar py-1">
          {/* All Toggle Card */}
          <button
            onClick={() => setKpiFilter(null)}
            className={cn(
              "p-4 min-w-[120px] rounded-2xl border transition text-left cursor-pointer select-none shrink-0 flex flex-col justify-between",
              kpiFilter === null
                ? "bg-blue-50/80 border-[#2F54EB] ring-1 ring-[#2F54EB]"
                : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-9 h-5 rounded-full p-0.5 transition flex items-center",
                  kpiFilter === null ? "bg-[#2F54EB] justify-end" : "bg-slate-300 justify-start"
                )}
              >
                <div className="h-4 w-4 rounded-full bg-white shadow-xs" />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-bold text-sm text-slate-900 block">All</span>
              <span className="text-[11px] text-slate-400">All Metrics</span>
            </div>
          </button>

          {/* 17 Statistics Cards */}
          {statCards.map((card) => {
            const isSelected = kpiFilter === card.key;
            return (
              <button
                key={card.key}
                onClick={() => setKpiFilter(isSelected ? null : card.key)}
                className={cn(
                  "p-4 min-w-[140px] rounded-2xl border transition text-left cursor-pointer select-none shrink-0 flex flex-col justify-between",
                  isSelected
                    ? "bg-blue-50/80 border-[#2F54EB] ring-1 ring-[#2F54EB]"
                    : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm"
                )}
              >
                <span className={cn("text-2xl font-bold tracking-tight block", card.color)}>
                  {card.value}
                </span>
                <span className="text-xs font-semibold text-slate-600 mt-2 block whitespace-nowrap">
                  {card.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Results Count & Dropdown Filter Row matching ref-1 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left: Results Count */}
        <div className="text-base font-bold text-slate-900">
          {filteredRooms.length} Results
        </div>

        {/* Right: Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Tags Filter */}
          <div className="relative">
            <select
              value={typeTagFilter}
              onChange={(e) => setTypeTagFilter(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Type Tags</option>
              <option value="Room">Standard Room</option>
              <option value="Flat | 1RK">Flat | 1RK</option>
              <option value="Flat | 1BHK">Flat | 1BHK</option>
              <option value="Studio Apartment">Studio Apartment</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Vacancy Type Filter */}
          <div className="relative">
            <select
              value={vacancyFilter}
              onChange={(e) => setVacancyFilter(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Vacancy Type</option>
              <option value="VACANT">Vacant</option>
              <option value="SEMI_VACANT">Semi-Vacant</option>
              <option value="OCCUPIED">Fully Occupied</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Status</option>
              <option value="ACTIVE">Active for Rent</option>
              <option value="DISABLED">Disabled for Rent</option>
              <option value="UNPUBLISHED">Unpublished</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Sharing Type Filter */}
          <div className="relative">
            <select
              value={sharingFilter}
              onChange={(e) => setSharingFilter(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Sharing Type</option>
              <option value="SINGLE">Single</option>
              <option value="DOUBLE">2-Sharing</option>
              <option value="TRIPLE">3-Sharing</option>
              <option value="FOUR_SHARING">4-Sharing</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Unit Type Filter */}
          <div className="relative">
            <select
              value={unitTypeFilter}
              onChange={(e) => setUnitTypeFilter(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Unit Type</option>
              <option value="Room">Room</option>
              <option value="Flat | 1RK">1RK</option>
              <option value="Flat | 1BHK">1BHK</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Filters Reset / Options Button */}
          <button
            onClick={() => {
              setSearch("");
              setFloorFilter("ALL");
              setTypeTagFilter("ALL");
              setVacancyFilter("ALL");
              setStatusFilter("ALL");
              setSharingFilter("ALL");
              setUnitTypeFilter("ALL");
              setKpiFilter(null);
              toast.info("All filters reset");
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* 4. Floor-Wise Filter Strip matching ref-1 */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {/* Room View Label */}
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold shrink-0">
          <span>Room View</span>
          <div className="flex items-center">
            <ChevronLeft className="h-3 w-3" />
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>

        {/* All Floors Pill */}
        <button
          onClick={() => setFloorFilter("ALL")}
          className={cn(
            "px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 shadow-2xs",
            floorFilter === "ALL"
              ? "bg-[#2F54EB] text-white shadow-sm shadow-blue-500/25"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          )}
        >
          All Floors
        </button>

        {/* Individual Floors Pills */}
        {(distinctFloors.length > 0
          ? distinctFloors
          : ["Ground Floor", "1st Floor", "2nd Floor"]
        ).map((floorName) => {
          const isSelected = floorFilter === floorName;
          const shortName = floorName.replace(" Floor", "");
          return (
            <button
              key={floorName}
              onClick={() => setFloorFilter(floorName)}
              className={cn(
                "px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 shadow-2xs",
                isSelected
                  ? "bg-[#2F54EB] text-white shadow-sm shadow-blue-500/25 font-bold"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              {shortName}
            </button>
          );
        })}
      </div>

      {/* 5. Rooms Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC] text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSort("roomNumber")}
                  className="py-3.5 px-6 cursor-pointer hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>ROOM</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("occupancy")}
                  className="py-3.5 px-6 cursor-pointer hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>OCCUPANCY STATUS</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("rentAmount")}
                  className="py-3.5 px-6 cursor-pointer hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>RENT/BED</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3.5 px-6">REMARKS</th>
                <th className="py-3.5 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isRoomsLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Loader2 className="h-7 w-7 animate-spin mx-auto mb-2 text-[#2F54EB]" />
                    <span className="font-medium text-xs">Loading rooms inventory...</span>
                  </td>
                </tr>
              ) : groupedRooms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Bed className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-sm">No rooms found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try clearing filters or click &apos;Add Room&apos; to create inventory.
                    </p>
                  </td>
                </tr>
              ) : (
                groupedRooms.map((group) => (
                  <React.Fragment key={group.label}>
                    {/* Floor / Section Label Row matching ref-1 */}
                    <tr className="bg-[#FAFBFD] border-y border-slate-100/80">
                      <td
                        colSpan={5}
                        className="py-2.5 px-6 text-xs font-bold text-[#2F54EB] tracking-wide"
                      >
                        {group.label}
                      </td>
                    </tr>

                    {/* Room Rows */}
                    {group.rooms.map((room: any) => {
                      const beds = room.beds || [];
                      const isMenuOpen = activeMenuRoomId === room.id;

                      const defaultRoomThumbnail =
                        room.images?.[0] ||
                        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=120&q=80";

                      return (
                        <tr
                          key={room.id}
                          onClick={() => {
                            setSelectedRoomForDrawer(room);
                            setIsDrawerOpen(true);
                          }}
                          className="hover:bg-slate-50/80 transition cursor-pointer group"
                        >
                          {/* 1. ROOM Column: Thumbnail, Number, Info Icon */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-2xs group-hover:scale-105 transition">
                                <img
                                  src={defaultRoomThumbnail}
                                  alt={room.roomNumber}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">
                                  {room.roomNumber}
                                </span>
                                <div
                                  title={`${room.floor || "Ground Floor"} · ${
                                    room.sharingType
                                  } · ${room.unitType || "Room"}`}
                                  className="text-slate-400 hover:text-slate-600 cursor-help"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Info className="h-3.5 w-3.5" />
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. OCCUPANCY STATUS Column: Bed Icons Matrix */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {beds.length === 0 ? (
                                <span className="text-xs text-slate-400">No beds</span>
                              ) : (
                                beds.map((bed: any) => {
                                  const isOccupied =
                                    bed.status === "OCCUPIED" ||
                                    bed.status === "RESERVED" ||
                                    (bed.residents && bed.residents.length > 0);
                                  const resident = bed.residents?.[0];
                                  const isNotice = resident?.status === "NOTICE_PERIOD";
                                  const isPendingMoveIn =
                                    resident?.status === "PENDING_MOVE_IN" ||
                                    bed.status === "RESERVED";

                                  return (
                                    <div
                                      key={bed.id}
                                      title={`Bed: ${bed.bedNumber} (${
                                        isOccupied
                                          ? `Occupied${
                                              resident
                                                ? ` by ${resident.firstName}${
                                                    resident.lastName
                                                      ? ` ${resident.lastName}`
                                                      : ""
                                                  }${
                                                    isPendingMoveIn
                                                      ? " (Pending Move-In)"
                                                      : ""
                                                  }`
                                                : " (Reserved)"
                                            }`
                                          : "Vacant"
                                      })`}
                                      className={cn(
                                        "h-6 w-6 rounded-lg flex items-center justify-center transition shadow-2xs",
                                        isNotice
                                          ? "bg-amber-100 text-amber-700"
                                          : isOccupied
                                          ? "bg-rose-100 text-rose-600"
                                          : "bg-emerald-100 text-emerald-600"
                                      )}
                                    >
                                      <Bed className="h-3.5 w-3.5" />
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </td>

                          {/* 3. RENT/BED Column */}
                          <td className="py-4 px-6 font-bold text-sm text-slate-900">
                            {formatINR(room.rentAmount)}
                          </td>

                          {/* 4. REMARKS Column */}
                          <td className="py-4 px-6 text-xs text-slate-500">
                            {room.remarks ||
                              (room.amenities && room.amenities.length > 0
                                ? room.amenities.slice(0, 2).join(", ")
                                : "-")}
                          </td>

                          {/* 5. ACTIONS Column */}
                          <td
                            className="py-4 px-6 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-2">
                              {/* 1. Add Tenants to Empty Beds Button (Primary Blue) */}
                              <button
                                onClick={() => {
                                  setSelectedRoomForChooseBeds(room);
                                  setIsChooseBedsOpen(true);
                                }}
                                title="Add Tenant to Empty Bed"
                                className="h-9 w-9 rounded-xl bg-[#2F54EB] hover:bg-blue-700 text-white flex items-center justify-center shadow-sm shadow-blue-500/25 transition cursor-pointer active:scale-95"
                              >
                                <UserPlus className="h-4 w-4" />
                              </button>

                              {/* 2. Share Button (White Outlined) */}
                              <button
                                onClick={() => handleShareRoom(room)}
                                title="Share Room"
                                className="h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center shadow-2xs transition cursor-pointer active:scale-95"
                              >
                                <Share2 className="h-4 w-4" />
                              </button>

                              {/* 3. Three Dots Dropdown Action Menu */}
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setActiveMenuRoomId(isMenuOpen ? null : room.id)
                                  }
                                  title="More Options"
                                  className="h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center shadow-2xs transition cursor-pointer active:scale-95"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>

                                {isMenuOpen && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-40"
                                      onClick={() => setActiveMenuRoomId(null)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 text-left text-xs space-y-0.5">
                                      <button
                                        onClick={() => {
                                          setActiveMenuRoomId(null);
                                          setSelectedRoomForChooseBeds(room);
                                          setIsChooseBedsOpen(true);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium cursor-pointer"
                                      >
                                        <UserPlus className="h-3.5 w-3.5 text-blue-600" />
                                        <span>Add Tenant</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          setActiveMenuRoomId(null);
                                          setEditRoomOpen(true, room);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium cursor-pointer"
                                      >
                                        <Edit className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Edit Room</span>
                                      </button>

                                      <button
                                        onClick={() => handleShareRoom(room)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition font-medium cursor-pointer"
                                      >
                                        <Share2 className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Share Room</span>
                                      </button>

                                      <button
                                        onClick={() => disableRentMutation.mutate(room.id)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition font-medium cursor-pointer"
                                      >
                                        <Ban className="h-3.5 w-3.5 text-amber-500" />
                                        <span>
                                          {room.isDisabledForRent
                                            ? "Enable for Rent"
                                            : "Disable for Rent"}
                                        </span>
                                      </button>

                                      <button
                                        onClick={() => publishMutation.mutate(room.id)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition font-medium cursor-pointer"
                                      >
                                        <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                                        <span>
                                          {room.isPublished ? "Unpublish" : "Publish"}
                                        </span>
                                      </button>

                                      <div className="pt-1 border-t border-slate-100">
                                        <button
                                          onClick={() => {
                                            if (
                                              confirm(
                                                `Are you sure you want to delete Room ${room.roomNumber}?`
                                              )
                                            ) {
                                              deleteRoomMutation.mutate(room.id);
                                            }
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition font-medium cursor-pointer"
                                        >
                                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                          <span>Delete Room</span>
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Choose Beds Modal Popup (ref-3) */}
      <ChooseBedsModal
        isOpen={isChooseBedsOpen}
        onClose={() => setIsChooseBedsOpen(false)}
        room={selectedRoomForChooseBeds}
        propertyId={propertyId}
      />

      {/* Right-Side Room Details Drawer (ref-2) */}
      <RoomDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        room={selectedRoomForDrawer}
        allRooms={filteredRooms}
        onSelectRoom={(r) => setSelectedRoomForDrawer(r)}
        onOpenChooseBeds={(r) => {
          setSelectedRoomForChooseBeds(r);
          setIsChooseBedsOpen(true);
        }}
        propertyId={propertyId}
      />
    </div>
  );
}
