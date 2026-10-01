// ─── Rent & Payment Types ──────────────────────────────────────────────────
// Derived from backend RentRecord.model.js, Payment.model.js, and rent.controller.js

export type RentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'waived';

export type PaymentMethod =
  | 'online'
  | 'cash'
  | 'upi'
  | 'bank_transfer'
  | 'cheque'
  | 'other';

export interface AdditionalCharge {
  description: string;
  amount: number;
}

export interface PaymentEntry {
  _id: string;
  amount: number;
  paidAt: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface RentReminder {
  _id: string;
  channel: 'whatsapp' | 'sms' | 'email';
  sentAt: string;
  status: 'sent' | 'failed' | 'delivered';
  message?: string;
}

export interface RentRecord {
  _id: string;
  tenant: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    user?: {
      _id: string;
      name: string;
      phone: string;
    };
  };
  pg: {
    _id: string;
    name: string;
  };
  owner: string;
  room?: {
    _id: string;
    roomNumber: string;
  } | null;
  bed?: {
    _id: string;
    bedLabel: string;
  } | null;
  billingMonth: number;
  billingYear: number;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  rentAmount: number;
  lateFee: number;
  discount: number;
  additionalCharges: AdditionalCharge[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount?: number;
  dueDate: string;
  status: RentStatus;
  paymentHistory: PaymentEntry[];
  paymentLink?: {
    linkId?: string;
    shortUrl?: string;
    qrCodeUrl?: string;
    status?: string;
  };
  remindersSent: RentReminder[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentSettings {
  dueDayOfMonth: number;
  gracePeriodDays: number;
  lateFeePerDay: number;
  autoRemindWhatsApp: boolean;
  remindDaysBeforeDue: number;
  upiId?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  qrCodeUrl?: string;
}

export interface RentSummary {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  partialCount: number;
  collectionRate: number;
}

export interface GenerateRentRequest {
  month: number;
  year: number;
  dueDayOfMonth?: number;
}

export interface GenerateRentResponse {
  created: number;
  skipped: number;
  total: number;
  records: RentRecord[];
}

export interface MarkRentPaidRequest {
  amount: number;
  method?: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface SendReminderRequest {
  channel: 'whatsapp' | 'sms' | 'email';
  type?: 'upcoming' | 'overdue' | 'custom';
  customMessage?: string;
}
