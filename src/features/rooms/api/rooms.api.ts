import { apiClient } from '@/lib/api/client';
import type { Room, Bed, UpdateBedPayload, CreatePGRoomPayload, UpdateRoomPayload } from '@/types/property';

// ─── Extended Types ────────────────────────────────────────────────────────────

export interface RoomsQueryResult {
  rooms: Room[];
  stats: {
    totalRooms: number;
    occupiedRooms: number;
    vacantRooms: number;
    partialRooms: number;
    totalBeds: number;
    occupiedBeds: number;
    vacantBeds: number;
    occupancyRate: number;
  };
}

export interface RoomDetailResult {
  room: Room;
  beds: Bed[];
}

export interface AssignResidentPayload {
  name: string;
  phone: string;
  joinDate: string;
  monthlyRent?: number;
  securityDeposit?: number;
}

export interface VacateBedPayload {
  tenantId?: string;
}

// ─── Rooms API ─────────────────────────────────────────────────────────────────

export const roomsApi = {
  // Get all rooms for a PG with stats
  getPGRooms: async (pgId: string, filter?: 'all' | 'vacant' | 'occupied'): Promise<RoomsQueryResult> => {
    const params: Record<string, string> = {};
    if (filter && filter !== 'all') params.status = filter;

    const res = await apiClient.get<
      { rooms: Room[]; stats?: RoomsQueryResult['stats'] } | Room[]
    >(`/manage/pgs/${pgId}/rooms`, params);

    const raw = res as unknown as { data?: { rooms?: Room[]; stats?: RoomsQueryResult['stats'] } } & {
      rooms?: Room[];
      stats?: RoomsQueryResult['stats'];
    };

    const data = raw?.data ?? raw;
    const rooms: Room[] = Array.isArray(data)
      ? data
      : Array.isArray((data as { rooms?: Room[] }).rooms)
      ? (data as { rooms: Room[] }).rooms
      : [];

    const backendStats = (data as { stats?: RoomsQueryResult['stats'] }).stats;

    // Compute local stats if not returned by backend
    const totalBeds = rooms.reduce((acc, r) => acc + (r.totalBeds || r.beds?.length || 0), 0);
    const occupiedBeds = rooms.reduce((acc, r) => {
      const occ = (r.beds || []).filter((b) => b.status === 'occupied' || (b as unknown as { isOccupied?: boolean }).isOccupied).length;
      return acc + (r.occupiedBeds ?? occ);
    }, 0);
    const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupiedRooms = rooms.filter((r) => {
      const cap = r.totalBeds || r.beds?.length || 1;
      const occ = r.occupiedBeds || (r.beds || []).filter((b) => b.status === 'occupied').length;
      return occ >= cap && cap > 0;
    }).length;
    const vacantRooms = rooms.filter((r) => {
      const occ = r.occupiedBeds || (r.beds || []).filter((b) => b.status === 'occupied').length;
      return occ === 0;
    }).length;

    return {
      rooms,
      stats: backendStats ?? {
        totalRooms: rooms.length,
        occupiedRooms,
        vacantRooms,
        partialRooms: rooms.length - occupiedRooms - vacantRooms,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      },
    };
  },

  // Get single room detail with beds
  getRoom: async (roomId: string): Promise<RoomDetailResult> => {
    const res = await apiClient.get<{ room?: Room; data?: Room; beds?: Bed[] } | Room>(
      `/manage/rooms/${roomId}`
    );
    const raw = res as unknown as { data?: { room?: Room; beds?: Bed[] } & Room } & {
      room?: Room;
      beds?: Bed[];
    };
    const data = raw?.data ?? raw;
    const room: Room = (data as { room?: Room }).room ?? (data as Room);
    const beds: Bed[] = (data as { beds?: Bed[] }).beds ?? room.beds ?? [];
    return { room, beds };
  },

  // Create a new room for a PG
  createPGRoom: (pgId: string, payload: CreatePGRoomPayload) => {
    const rentVal = payload.rentPerBed ?? payload.rent ?? 0;
    return apiClient.post<Room>(`/manage/pgs/${pgId}/rooms`, {
      ...payload,
      rentPerBed: rentVal,
      rent: rentVal,
      monthlyRent: rentVal,
    });
  },

  // Update a room
  updateRoom: (roomId: string, payload: UpdateRoomPayload) => {
    const rentVal =
      payload.rentPerBed ??
      payload.rent ??
      (payload.monthlyRent !== undefined ? Number(payload.monthlyRent) : undefined);
    return apiClient.put<Room>(`/manage/rooms/${roomId}`, {
      ...payload,
      ...(rentVal !== undefined
        ? { rentPerBed: rentVal, rent: rentVal, monthlyRent: rentVal }
        : {}),
    });
  },

  // Delete a room
  deleteRoom: (roomId: string) =>
    apiClient.delete(`/manage/rooms/${roomId}`),

  // Get beds for a room
  getRoomBeds: (roomId: string) =>
    apiClient.get<Bed[]>(`/manage/rooms/${roomId}/beds`),

  // Update a bed (status, notes, rentOverride)
  updateBed: (bedId: string, payload: UpdateBedPayload) =>
    apiClient.put<Bed>(`/manage/beds/${bedId}`, payload),

  // Quick assign resident to a bed via official tenant onboarding API
  assignResident: async (
    pgId: string,
    roomId: string,
    bedId: string,
    tenantData: AssignResidentPayload
  ) => {
    return await apiClient.post(`/manage/pgs/${pgId}/tenants`, {
      name: tenantData.name.trim(),
      phone: tenantData.phone.trim(),
      joinDate: tenantData.joinDate,
      monthlyRent: Number(tenantData.monthlyRent) || 0,
      securityDeposit: Number(tenantData.securityDeposit) || 0,
      bedId,
      bed: bedId,
      roomId,
      room: roomId,
    });
  },

  // Vacate a bed via official tenant vacate API
  vacateBed: async (pgId: string, roomId: string, bedId: string, tenantId?: string) => {
    if (tenantId) {
      return await apiClient.post(`/manage/tenants/${tenantId}/vacate`, {});
    }
    return await apiClient.put<Bed>(`/manage/beds/${bedId}`, {
      status: 'vacant',
      notes: undefined,
    });
  },

  // Update room photo directly
  uploadRoomPhoto: (roomId: string, image: string, imagePublicId?: string) =>
    apiClient.put<Room>(`/manage/rooms/${roomId}`, { image, imagePublicId }),
};
