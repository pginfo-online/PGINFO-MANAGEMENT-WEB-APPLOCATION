import { apiClient } from '@/lib/api/client';
import type {
  OwnerDashboardSummary,
  PropertyDashboardSummary,
  FinancialReport,
} from '@/types/dashboard';

export const dashboardApi = {
  getOwnerDashboard: () =>
    apiClient.get<OwnerDashboardSummary>('/manage/dashboard'),

  getPropertyDashboard: (pgId: string) =>
    apiClient.get<PropertyDashboardSummary>(`/manage/pgs/${pgId}/dashboard`),

  getFinancialReport: (year?: number, pgId?: string) =>
    apiClient.get<FinancialReport>('/manage/reports/financial', { year, pgId }),
};
