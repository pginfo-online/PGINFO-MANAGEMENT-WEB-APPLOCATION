import { apiClient } from '@/lib/api/client';
import type {
  Building,
  Floor,
  Room,
  Bed,
  CreateBuildingPayload,
  UpdateBuildingPayload,
  CreateFloorPayload,
  UpdateFloorPayload,
  CreateRoomPayload,
  CreatePGRoomPayload,
  UpdateRoomPayload,
  UpdateBedPayload,
  CreatePropertyPayload,
} from '@/types/property';

export const propertyApi = {
  // PG
  createProperty: async (payload: CreatePropertyPayload) => {
    try {
      return await apiClient.post<{
        property: Record<string, unknown>;
        pg: Record<string, unknown>;
      }>('/properties', payload);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        '[propertyApi.createProperty] /properties failed, attempting /pg fallback:',
        errorMsg
      );
      return await apiClient.post<{
        property: Record<string, unknown>;
        pg: Record<string, unknown>;
      }>('/pg', {
        name: payload.title,
        title: payload.title,
        category: 'pg',
        city: payload.city,
        area: payload.area,
        address: payload.address,
        mapsLink: payload.mapsLink,
        googlePlaceId: payload.googlePlaceId,
        latitude: payload.latitude,
        longitude: payload.longitude,
        contactPhone: payload.contactPhone,
        contactWhatsapp: payload.contactWhatsapp || payload.contactPhone,
        pricing: payload.pricing,
        facilities: payload.amenities,
        roomConfigs: payload.pgDetails.roomConfigs,
        gender: payload.pgDetails.gender || 'any',
      });
    }
  },

  getProperty: async (id: string) => {
    try {
      const res = await apiClient.get<{ property?: Record<string, unknown>; pg?: Record<string, unknown> }>(`/properties/${id}`);
      return (res.data?.property || res.data?.pg || res.data) as Record<string, unknown>;
    } catch {
      const res = await apiClient.get<{ property?: Record<string, unknown>; pg?: Record<string, unknown> }>(`/pg/${id}`);
      return (res.data?.pg || res.data?.property || res.data) as Record<string, unknown>;
    }
  },

  updateProperty: async (id: string, payload: Record<string, unknown>) => {
    try {
      return await apiClient.put<{ property?: Record<string, unknown>; pg?: Record<string, unknown> }>(
        `/properties/${id}`,
        payload
      );
    } catch (err: unknown) {
      console.warn('[propertyApi.updateProperty] /properties failed, attempting /pg fallback:', err);
      return await apiClient.put<{ property?: Record<string, unknown>; pg?: Record<string, unknown> }>(
        `/pg/${id}`,
        payload
      );
    }
  },

  deleteProperty: async (id: string) => {
    try {
      return await apiClient.delete(`/properties/${id}`);
    } catch {
      return await apiClient.delete(`/pg/${id}`);
    }
  },

  deletePropertyPhoto: async (propertyId: string, publicId: string) => {
    return await apiClient.delete(`/upload/image/${propertyId}`, {
      body: JSON.stringify({ publicId }),
    });
  },

  getAvailability: (pgId: string) =>
    apiClient.get<Record<string, unknown>>(`/manage/pgs/${pgId}/availability`),

  getHierarchy: (pgId: string) =>
    apiClient.get<{ buildings: Building[] }>(`/manage/pgs/${pgId}/hierarchy`),

  getPGRooms: (pgId: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiClient.get<{ rooms: Room[]; stats?: Record<string, number> } | Room[]>(
      `/manage/pgs/${pgId}/rooms`,
      params
    ),

  // Buildings
  getBuildings: (pgId: string) =>
    apiClient.get<Building[]>(`/manage/pgs/${pgId}/buildings`),

  getBuilding: (id: string) =>
    apiClient.get<Building>(`/manage/buildings/${id}`),

  createBuilding: (pgId: string, payload: CreateBuildingPayload) =>
    apiClient.post<Building>(`/manage/pgs/${pgId}/buildings`, payload),

  updateBuilding: (id: string, payload: UpdateBuildingPayload) =>
    apiClient.put<Building>(`/manage/buildings/${id}`, payload),

  deleteBuilding: (id: string) =>
    apiClient.delete(`/manage/buildings/${id}`),

  // Floors
  getFloors: (buildingId: string) =>
    apiClient.get<Floor[]>(`/manage/buildings/${buildingId}/floors`),

  createFloor: (buildingId: string, payload: CreateFloorPayload) =>
    apiClient.post<Floor>(`/manage/buildings/${buildingId}/floors`, payload),

  updateFloor: (id: string, payload: UpdateFloorPayload) =>
    apiClient.put<Floor>(`/manage/floors/${id}`, payload),

  deleteFloor: (id: string) =>
    apiClient.delete(`/manage/floors/${id}`),

  // Rooms
  getFloorRooms: (floorId: string) =>
    apiClient.get<Room[]>(`/manage/floors/${floorId}/rooms`),

  getRoom: (id: string) =>
    apiClient.get<Room>(`/manage/rooms/${id}`),

  createRoom: (floorId: string, payload: CreateRoomPayload) =>
    apiClient.post<Room>(`/manage/floors/${floorId}/rooms`, payload),

  createPGRoom: (pgId: string, payload: CreatePGRoomPayload) => {
    const rentVal = payload.rentPerBed ?? payload.rent ?? 0;
    return apiClient.post<Room>(`/manage/pgs/${pgId}/rooms`, {
      ...payload,
      rentPerBed: rentVal,
      rent: rentVal,
      monthlyRent: rentVal,
    });
  },

  updateRoom: (id: string, payload: UpdateRoomPayload) => {
    const rentVal =
      payload.rentPerBed ??
      payload.rent ??
      (payload.monthlyRent !== undefined ? Number(payload.monthlyRent) : undefined);
    return apiClient.put<Room>(`/manage/rooms/${id}`, {
      ...payload,
      ...(rentVal !== undefined
        ? { rentPerBed: rentVal, rent: rentVal, monthlyRent: rentVal }
        : {}),
    });
  },

  deleteRoom: (id: string) =>
    apiClient.delete(`/manage/rooms/${id}`),

  // Beds
  getRoomBeds: (roomId: string) =>
    apiClient.get<Bed[]>(`/manage/rooms/${roomId}/beds`),

  updateBed: (id: string, payload: UpdateBedPayload) =>
    apiClient.put<Bed>(`/manage/beds/${id}`, payload),
};
