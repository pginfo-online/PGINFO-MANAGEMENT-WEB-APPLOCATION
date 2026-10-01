// ─── Agreement Types ────────────────────────────────────────────────────────
// Derived from backend Agreement.model.js and agreement.controller.js

export type AgreementStatus = 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';

export interface Agreement {
  _id: string;
  agreementNumber: string;
  tenant: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
  };
  pg: {
    _id: string;
    name: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
  };
  owner: string;
  building?: {
    _id: string;
    name: string;
  } | null;
  room?: {
    _id: string;
    roomNumber: string;
  } | null;
  bed?: {
    _id: string;
    bedLabel: string;
  } | null;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  noticePeriodDays: number;
  status: AgreementStatus;
  termsAndConditions?: string[];
  pdfUrl?: string;
  pdfGeneratedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgreementPayload {
  tenantId: string;
  roomId?: string;
  bedId?: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  noticePeriodDays?: number;
  termsAndConditions?: string[];
}
