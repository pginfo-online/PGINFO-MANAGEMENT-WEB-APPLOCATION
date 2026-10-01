import { apiClient } from '@/lib/api/client';
import type { Agreement, CreateAgreementPayload } from '@/types/agreement';

export const agreementApi = {
  getAgreements: (pgId: string) =>
    apiClient.get<{ agreements: Agreement[]; pagination?: Record<string, unknown> } | Agreement[]>(
      `/manage/pgs/${pgId}/agreements`
    ),

  getAgreement: (id: string) =>
    apiClient.get<Agreement>(`/manage/agreements/${id}`),

  createAgreement: (pgId: string, payload: CreateAgreementPayload) =>
    apiClient.post<Agreement>(`/manage/pgs/${pgId}/agreements`, payload),

  updateAgreement: (id: string, payload: Partial<CreateAgreementPayload>) =>
    apiClient.put<Agreement>(`/manage/agreements/${id}`, payload),

  getAgreementPdf: (id: string) =>
    apiClient.get<{ pdfUrl: string }>(`/manage/agreements/${id}/pdf`),

  regeneratePdf: (id: string) =>
    apiClient.post<Agreement>(`/manage/agreements/${id}/regenerate-pdf`),
};
