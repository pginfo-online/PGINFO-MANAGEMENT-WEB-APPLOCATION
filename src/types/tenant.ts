// ─── Tenant Types ─────────────────────────────────────────────────────────────
// Derived from backend Tenant.model.js and Mobile Screen Specifications

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

export interface TenantRoomInfo {
  _id: string;
  roomNumber: string;
  shareType?: string;
  floorLabel?: string;
  rentPerBed?: number;
}

export interface TenantBedInfo {
  _id: string;
  bedLabel: string;
  status?: string;
}

export interface TenantUserInfo {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  profilePhoto?: string | null;
}

export interface Tenant {
  _id: string;
  id?: string;
  user?: string | TenantUserInfo | null;
  pg: string;
  owner: string;
  building?: string | { _id: string; name: string } | null;
  floor?: string | { _id: string; name: string; floorNumber?: number } | null;
  room?: string | TenantRoomInfo | null;
  bed?: string | TenantBedInfo | null;
  name: string;
  email?: string | null;
  phone: string;
  profilePhoto?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  dateOfBirth?: string | null;
  profession?: Profession | null;
  aadhaar?: string | null;
  documents?: TenantDocument[];
  emergencyContact?: EmergencyContact;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  joinDate: string;
  expectedLeaveDate?: string | null;
  actualLeaveDate?: string | null;
  noticePeriodDays?: number;
  lockInPeriodMonths?: number;
  lockInEndDate?: string | null;
  rentCycle: RentCycle;
  billingDate: number;
  monthlyRent: number;
  securityDeposit: number;
  depositStatus: DepositStatus;
  status: TenantStatus;
  notes?: string | null;
  foodPreference: FoodPreference;
  isLinkedToUser?: boolean;
  // Virtuals
  rentAmount?: number;
  joiningDate?: string;
  noticePeriod?: number;
  roomNumber?: string;
  bedNumber?: string;
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

export interface SystemUserSummary {
  userId: string;
  name: string;
  email: string;
  phone: string;
  profilePhoto: string | null;
  isRegisteredUser: boolean;
}

export interface GetTenantsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  room?: string;
  rentCycle?: string;
}

export interface AddTenantPayload {
  name: string;
  phone: string;
  email?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  profession?: Profession | string;
  aadhaar?: string;
  room?: string;
  roomId?: string;
  bed?: string;
  bedId?: string;
  building?: string;
  buildingId?: string;
  floor?: string;
  floorId?: string;
  joinDate: string;
  joiningDate?: string;
  expectedLeaveDate?: string | null;
  noticePeriodDays?: number;
  lockInPeriodMonths?: number;
  monthlyRent: number;
  rentAmount?: number;
  securityDeposit?: number;
  depositStatus?: DepositStatus | string;
  rentCycle?: RentCycle;
  billingDate?: number;
  foodPreference?: FoodPreference | string;
  emergencyContact?: EmergencyContact;
  notes?: string;
}

export interface UpdateTenantPayload extends Partial<AddTenantPayload> {
  status?: TenantStatus | string;
  actualLeaveDate?: string | null;
}

export interface VacateTenantPayload {
  actualLeaveDate?: string;
  refundDeposit?: boolean;
}

export interface AssignBedPayload {
  bedId: string;
}
