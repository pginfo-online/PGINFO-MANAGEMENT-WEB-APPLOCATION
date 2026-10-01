// ─── Auth Types ───────────────────────────────────────────────────────────────
// Derived from backend User.model.js, capabilities.js, and auth.controller.js

export type UserRole =
  | 'admin'
  | 'owner'
  | 'tenant'
  | 'staff'
  | 'property_manager'
  | 'hotel_owner'
  | 'pg_owner'
  | 'meetup_organizer'
  | 'hot_deals_partner';

export type Capability =
  | 'can_manage_pgs'
  | 'can_manage_hotels'
  | 'can_manage_buffets'
  | 'can_manage_meetups'
  | 'can_manage_hot_deals'
  | 'can_manage_staff'
  | 'is_admin'
  | 'is_pg_owner'
  | 'is_hotel_owner'
  | 'can_access_analytics';

export type AvailableMode = 'explore' | 'pg_owner' | 'hotel_owner';

export interface User {
  _id: string;
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: UserRole[];
  role: UserRole;
  isHotelOwner: boolean;
  isActive: boolean;
  profilePhoto?: string | null;
  altPhone?: string | null;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  dob?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContext {
  user: User;
  capabilities: Capability[];
  memberships: Record<string, number>;
  availableModes: AvailableMode[];
}

export interface LoginResponse {
  isNewUser: false;
  user: User;
  token: string;
}

export interface NewUserResponse {
  isNewUser: true;
  tempToken: string;
}

export type VerifyOtpResponse = LoginResponse | NewUserResponse;

export interface SendOtpPayload {
  contact: string;
  type: 'phone' | 'email';
  sendWhatsApp?: boolean;
}

export interface VerifyOtpPayload {
  contact: string;
  otp: string;
  isMobile?: boolean;
}

export interface RegisterCompletePayload {
  tempToken: string;
  name: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  capabilities: Capability[];
  availableModes: AvailableMode[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isOwner: boolean;
}
