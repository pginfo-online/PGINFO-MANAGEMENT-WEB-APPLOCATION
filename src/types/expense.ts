// ─── Expense Types ──────────────────────────────────────────────────────────
// Derived from backend Expense.model.js and expense.controller.js

export type ExpenseCategory =
  | 'maintenance'
  | 'utilities'
  | 'electricity'
  | 'water'
  | 'staff_salary'
  | 'salary'
  | 'food'
  | 'groceries'
  | 'cleaning'
  | 'housekeeping'
  | 'repairs'
  | 'security'
  | 'internet'
  | 'rent'
  | 'furniture'
  | 'equipment'
  | 'taxes'
  | 'insurance'
  | 'marketing'
  | 'gas'
  | 'miscellaneous'
  | 'other';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export type ExpensePaymentMethod =
  | 'cash'
  | 'upi'
  | 'bank_transfer'
  | 'cheque'
  | 'card'
  | 'other';

export interface Expense {
  _id: string;
  pg: {
    _id: string;
    name: string;
  };
  owner: string;
  category: ExpenseCategory;
  subcategory?: string;
  description: string;
  amount: number;
  expenseDate: string;
  vendor?: string;
  vendorPhone?: string;
  paymentMethod: ExpensePaymentMethod;
  referenceNumber?: string;
  receiptUrl?: string;
  receiptPublicId?: string;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  staff?: {
    _id: string;
    name: string;
    role: string;
  } | null;
  status: ExpenseStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummary {
  totalAmount: number;
  byCategory: { category: ExpenseCategory; amount: number; count: number }[];
  byStatus: { status: ExpenseStatus; amount: number; count: number }[];
  monthlyTrend: { month: number; amount: number }[];
}

export interface CreateExpensePayload {
  category: ExpenseCategory;
  subcategory?: string;
  description: string;
  amount: number;
  expenseDate: string;
  vendor?: string;
  vendorPhone?: string;
  paymentMethod?: ExpensePaymentMethod;
  referenceNumber?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  staff?: string;
  notes?: string;
}
