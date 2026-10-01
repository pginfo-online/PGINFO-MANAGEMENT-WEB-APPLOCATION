import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '../api/rooms.api';
import type { CreatePGRoomPayload, UpdateRoomPayload, UpdateBedPayload } from '@/types/property';
import type { AssignResidentPayload } from '../api/rooms.api';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const roomKeys = {
  all: ['rooms'] as const,
  list: (pgId: string) => [...roomKeys.all, 'list', pgId] as const,
  detail: (roomId: string) => [...roomKeys.all, 'detail', roomId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function usePGRooms(pgId: string | undefined) {
  return useQuery({
    queryKey: roomKeys.list(pgId ?? ''),
    queryFn: () => roomsApi.getPGRooms(pgId!),
    enabled: !!pgId,
    staleTime: 30_000,
  });
}

export function useRoomDetail(roomId: string | undefined) {
  return useQuery({
    queryKey: roomKeys.detail(roomId ?? ''),
    queryFn: () => roomsApi.getRoom(roomId!),
    enabled: !!roomId,
    staleTime: 20_000,
  });
}

export function useCreateRoom(pgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePGRoomPayload) =>
      roomsApi.createPGRoom(pgId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomKeys.list(pgId) });
      qc.invalidateQueries({ queryKey: ['property-dashboard', pgId] });
    },
  });
}

export function useUpdateRoom(pgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, payload }: { roomId: string; payload: UpdateRoomPayload }) =>
      roomsApi.updateRoom(roomId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: roomKeys.list(pgId) });
      qc.invalidateQueries({ queryKey: roomKeys.detail(variables.roomId) });
      qc.invalidateQueries({ queryKey: ['property-dashboard', pgId] });
    },
  });
}

export function useDeleteRoom(pgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => roomsApi.deleteRoom(roomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomKeys.list(pgId) });
      qc.invalidateQueries({ queryKey: ['property-dashboard', pgId] });
    },
  });
}

export function useUpdateBed(pgId: string, roomId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bedId, payload }: { bedId: string; payload: UpdateBedPayload }) =>
      roomsApi.updateBed(bedId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomKeys.list(pgId) });
      if (roomId) qc.invalidateQueries({ queryKey: roomKeys.detail(roomId) });
      qc.invalidateQueries({ queryKey: ['property-dashboard', pgId] });
    },
  });
}

export function useAssignResident(pgId: string, roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bedId,
      tenantData,
    }: {
      bedId: string;
      tenantData: AssignResidentPayload;
    }) => roomsApi.assignResident(pgId, roomId, bedId, tenantData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomKeys.list(pgId) });
      qc.invalidateQueries({ queryKey: roomKeys.detail(roomId) });
      qc.invalidateQueries({ queryKey: ['pg-tenants', pgId] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['property-dashboard', pgId] });
    },
  });
}

export function useVacateBed(pgId: string, roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bedId, tenantId }: { bedId: string; tenantId?: string }) =>
      roomsApi.vacateBed(pgId, roomId, bedId, tenantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomKeys.list(pgId) });
      qc.invalidateQueries({ queryKey: roomKeys.detail(roomId) });
      qc.invalidateQueries({ queryKey: ['pg-tenants', pgId] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['property-dashboard', pgId] });
    },
  });
}

export function useUploadRoomPhoto(pgId: string, roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ image, imagePublicId }: { image: string; imagePublicId?: string }) =>
      roomsApi.uploadRoomPhoto(roomId, image, imagePublicId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomKeys.list(pgId) });
      qc.invalidateQueries({ queryKey: roomKeys.detail(roomId) });
    },
  });
}

