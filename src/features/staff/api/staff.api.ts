import { apiClient } from '@/lib/api/client';
import type { Staff, CreateStaffPayload, StaffPermissions } from '@/types/staff';

export const staffApi = {
  getStaffList: (pgId: string) =>
    apiClient.get<Staff[]>(`/manage/pgs/${pgId}/staff`),

  getStaffMember: (id: string) =>
    apiClient.get<Staff>(`/manage/staff/${id}`),

  addStaff: (pgId: string, payload: CreateStaffPayload) =>
    apiClient.post<Staff>(`/manage/pgs/${pgId}/staff`, payload),

  updateStaff: (id: string, payload: Partial<CreateStaffPayload>) =>
    apiClient.put<Staff>(`/manage/staff/${id}`, payload),

  updatePermissions: (id: string, permissions: Partial<StaffPermissions>) =>
    apiClient.put<Staff>(`/manage/staff/${id}/permissions`, permissions),

  deleteStaff: (id: string) =>
    apiClient.delete(`/manage/staff/${id}`),
};
