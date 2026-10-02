import { apiClient } from '@/lib/api/client';
import type {
  RentRecord,
  RentSettings,
  RentSummary,
  GenerateRentRequest,
  GenerateRentResponse,
  MarkRentPaidRequest,
  SendReminderRequest,
  CreatePaymentLinkResponse,
  VerifyPaymentStatusResponse,
  BulkRemindersResponse,
  RentReceiptResponse,
  RentReminder,
} from '@/types/rent';

export interface GetRentRecordsParams {
  page?: number;
  limit?: number;
  status?: string;
  month?: number | string;
  year?: number;
  search?: string;
}

export interface PaginatedRentResponse {
  success: true;
  message: string;
  data: RentRecord[];
  summary?: RentSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const rentApi = {
  getRentRecords: (pgId: string, params?: GetRentRecordsParams) =>
    apiClient.getPaginated<RentRecord>(
      `/manage/pgs/${pgId}/rent`,
      params as Record<string, string | number | boolean | undefined>
    ),

  getRentSummary: (pgId: string, params?: { month?: number | string; year?: number }) =>
    apiClient.get<RentSummary>(
      `/manage/pgs/${pgId}/rent/summary`,
      params as Record<string, string | number | boolean | undefined>
    ),

  generateRent: (pgId: string, payload: GenerateRentRequest) =>
    apiClient.post<GenerateRentResponse>(`/manage/pgs/${pgId}/rent/generate`, payload),

  getRentRecord: (id: string) =>
    apiClient.get<RentRecord>(`/manage/rent/${id}`),

  updateRentRecord: (id: string, payload: Partial<RentRecord>) =>
    apiClient.put<RentRecord>(`/manage/rent/${id}`, payload),

  deleteRentRecord: (id: string) =>
    apiClient.delete(`/manage/rent/${id}`),

  markRentPaid: (id: string, payload: MarkRentPaidRequest) =>
    apiClient.post<RentRecord>(`/manage/rent/${id}/mark-paid`, payload),

  sendReminder: (id: string, payload: SendReminderRequest) =>
    apiClient.post<{ success: boolean; message?: string }>(`/manage/rent/${id}/send-reminder`, payload),

  sendBulkReminders: (
    rentRecordIds: string[],
    channel: string = 'whatsapp',
    type: string = 'due_reminder'
  ) =>
    apiClient.post<BulkRemindersResponse>(
      '/manage/rent/bulk-reminders',
      {
        rentRecordIds,
        channel,
        type,
      }
    ),

  createPaymentLink: (id: string) =>
    apiClient.post<CreatePaymentLinkResponse>(`/manage/rent/${id}/payment-link`),

  verifyPaymentStatus: (id: string) =>
    apiClient.post<VerifyPaymentStatusResponse>(`/manage/rent/${id}/verify-status`),

  getReminders: (id: string) =>
    apiClient.get<RentReminder[]>(`/manage/rent/${id}/reminders`),

  getRentSettings: (pgId: string) =>
    apiClient.get<RentSettings>(`/manage/pgs/${pgId}/rent-settings`),

  updateRentSettings: (pgId: string, payload: Partial<RentSettings>) =>
    apiClient.put<RentSettings>(`/manage/pgs/${pgId}/rent-settings`, payload),

  getReceipt: (id: string) =>
    apiClient.get<RentReceiptResponse>(`/manage/rent/${id}/receipt`),
};

