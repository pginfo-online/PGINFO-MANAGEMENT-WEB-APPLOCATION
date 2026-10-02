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
  channel: 'whatsapp' | 'sms' | 'email' | 'push';
  sentAt?: string;
  createdAt?: string;
  status: 'sent' | 'failed' | 'delivered' | 'read';
  type?: 'due_reminder' | 'overdue' | 'payment_link' | 'receipt' | string;
  message?: string;
  error?: string;
}

export interface RentRecord {
  _id: string;
  tenant: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    profilePhoto?: string;
    user?: {
      _id: string;
      name: string;
      phone: string;
    };
  };
  pg: {
    _id: string;
    name: string;
    address?: string;
    phone?: string;
  };
  owner: string;
  room?: {
    _id: string;
    roomNumber: string;
    shareType?: string;
    floorLabel?: string;
  } | null;
  bed?: {
    _id: string;
    bedLabel: string;
    status?: string;
  } | null;
  billingMonth: number;
  billingYear: number;
  month?: string;
  year?: number;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  rentAmount: number;
  lateFee: number;
  discount: number;
  additionalCharges: AdditionalCharge[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount?: number;
  outstandingAmount?: number;
  dueDate: string;
  status: RentStatus;
  paymentHistory: PaymentEntry[];
  paymentLink?: string | {
    linkId?: string;
    shortUrl?: string;
    qrCodeUrl?: string;
    status?: string;
  } | null;
  paymentLinkId?: string | null;
  invoiceUrl?: string | null;
  invoiceNumber?: string | null;
  paymentMethod?: PaymentMethod | string;
  paidAt?: string;
  remindersSent: RentReminder[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentSettings {
  dueDayOfMonth: number;
  gracePeriodDays?: number;
  lateFeePerDay: number;
  autoRemindWhatsApp: boolean;
  autoRemindEmail?: boolean;
  remindDaysBeforeDue?: number;
  remindDaysBefore?: number;
  upiId?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  qrCodeUrl?: string;
}

export interface RentSummary {
  // Backend aggregate fields
  totalDue?: number;
  totalCollected?: number;
  totalOutstanding?: number;
  overdueCount?: number;
  paidCount?: number;
  pendingCount?: number;
  partialCount?: number;

  // Web/mobile alias fields for safety and backwards compatibility
  totalExpected?: number;
  totalPending?: number;
  totalOverdue?: number;
  collectionRate?: number;
  totalRecords?: number;
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
  channel?: 'whatsapp' | 'sms' | 'email' | 'push' | 'all';
  type?: 'due_reminder' | 'overdue' | 'custom' | string;
  customMessage?: string;
}

export interface CreatePaymentLinkResponse {
  paymentLink: string;
  paymentLinkId?: string;
  amount?: number;
  qrCodeUrl?: string;
}

export interface VerifyPaymentStatusResponse {
  verified: boolean;
  status: RentStatus | string;
  message?: string;
  record?: RentRecord;
}

export interface BulkRemindersResponse {
  total: number;
  successful: number;
  failed: number;
  results?: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;
}

export interface RentReceiptResponse {
  receiptUrl?: string;
  invoiceNumber?: string;
  html?: string;
}

