// ─── Staff Types ────────────────────────────────────────────────────────────
// Derived from backend Staff.model.js and staff.controller.js

export type StaffRole =
  | 'manager'
  | 'property_manager'
  | 'security'
  | 'cleaner'
  | 'cook'
  | 'electrician'
  | 'plumber'
  | 'gardener'
  | 'driver'
  | 'other';

export type StaffStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export interface StaffPermissions {
  canManageTenants: boolean;
  canCollectRent: boolean;
  canManageExpenses: boolean;
  canViewReports: boolean;
  canManageStaff: boolean;
}

export interface Staff {
  _id: string;
  user?: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
  } | null;
  pg: {
    _id: string;
    name: string;
  };
  owner: string;
  name: string;
  phone: string;
  email?: string | null;
  profilePhoto?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  dateOfBirth?: string | null;
  address?: string | null;
  aadhaar?: string | null;
  role: StaffRole;
  salary?: number | null;
  salaryCycle?: 'monthly' | 'weekly' | 'daily';
  joiningDate?: string;
  status: StaffStatus;
  permissions: StaffPermissions;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffPayload {
  name: string;
  phone: string;
  role: StaffRole;
  email?: string;
  salary?: number;
  salaryCycle?: 'monthly' | 'weekly' | 'daily';
  joiningDate?: string;
  permissions?: Partial<StaffPermissions>;
  address?: string;
  notes?: string;
}
