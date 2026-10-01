// ─── Tenant Types ─────────────────────────────────────────────────────────────
// Derived from backend Tenant.model.js

export type TenantStatus = 'pending' | 'active' | 'notice' | 'vacated' | 'inactive';
export type DepositStatus = 'pending' | 'received' | 'refunded' | 'partial';
export type Profession = 'student' | 'working_professional' | 'self_employed' | 'other';
export type FoodPreference = 'veg' | 'nonveg' | 'eggetarian' | 'none';
export type RentCycle = 'standard' | 'custom';
export type DocumentType = 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'other';

export interface EmergencyContact {
  name?: string;
  relationship?: string;
  relation?: string;
  phone?: string;
}

export interface TenantDocument {
  type: DocumentType;
  number?: string;
  fileUrl?: string;
  verified?: boolean;
}

export interface Tenant {
  _id: string;
  id: string;
  user?: string | null;
  pg: string;
  owner: string;
  building?: string | null;
  floor?: string | null;
  room?: string | { _id: string; roomNumber: string; shareType?: string; floorLabel?: string; rentPerBed?: number } | null;
  bed?: string | { _id: string; bedLabel: string; status?: string } | null;
  name: string;
  email?: string | null;
  phone: string;
  profilePhoto?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  dateOfBirth?: string | null;
  profession?: Profession | null;
  aadhaar?: string | null;
  documents: TenantDocument[];
  emergencyContact?: EmergencyContact;
  joinDate: string;
  expectedLeaveDate?: string | null;
  actualLeaveDate?: string | null;
  noticePeriodDays: number;
  lockInPeriodMonths: number;
  lockInEndDate?: string | null;
  rentCycle: RentCycle;
  billingDate: number;
  monthlyRent: number;
  securityDeposit: number;
  depositStatus: DepositStatus;
  status: TenantStatus;
  notes?: string | null;
  foodPreference: FoodPreference;
  isLinkedToUser: boolean;
  // Virtuals
  rentAmount?: number;
  joiningDate?: string;
  noticePeriod?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantListStats {
  totalTenants: number;
  pendingDue: number;
  underNotice: number;
  todayBooking: number;
  waitingToMove: number;
  movedOut: number;
}
