import { apiClient } from '@/lib/api/client';
import type {
  Expense,
  ExpenseSummary,
  CreateExpensePayload,
} from '@/types/expense';

export interface GetExpensesParams {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const expenseApi = {
  getExpenses: (pgId: string, params?: GetExpensesParams) =>
    apiClient.get<Expense[]>(
      `/manage/pgs/${pgId}/expenses`,
      params as Record<string, string | number | boolean | undefined>
    ),

  getExpense: (id: string) =>
    apiClient.get<Expense>(`/manage/expenses/${id}`),

  createExpense: (pgId: string, payload: CreateExpensePayload) =>
    apiClient.post<Expense>(`/manage/pgs/${pgId}/expenses`, payload),

  updateExpense: (id: string, payload: Partial<CreateExpensePayload>) =>
    apiClient.put<Expense>(`/manage/expenses/${id}`, payload),

  deleteExpense: (id: string) =>
    apiClient.delete(`/manage/expenses/${id}`),

  approveExpense: (id: string, notes?: string) =>
    apiClient.post<Expense>(`/manage/expenses/${id}/approve`, { notes }),

  rejectExpense: (id: string, reason?: string) =>
    apiClient.post<Expense>(`/manage/expenses/${id}/reject`, { reason }),

  uploadReceipt: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return apiClient.upload<Expense>(`/manage/expenses/${id}/receipt`, formData);
  },

  getExpenseSummary: (pgId: string) =>
    apiClient.get<ExpenseSummary>(`/manage/pgs/${pgId}/expenses/summary`),
};
