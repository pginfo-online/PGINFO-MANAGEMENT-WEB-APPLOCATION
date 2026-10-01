// ─── Property / PG Types ──────────────────────────────────────────────────────
// Derived from backend PG.model.js, Room.model.js, Bed.model.js, Building.model.js, Floor.model.js

export type PropertyType = 'PG' | 'Hostel' | 'Co-living' | 'Apartment' | 'Independent House' | 'Other';
export type PGStatus = 'draft' | 'pending' | 'submitted' | 'pending_review' | 'approved' | 'rejected' | 'correction_required' | 'suspended' | 'archived';
export type Gender = 'male' | 'female' | 'any';
export type ShareType = 'single' | 'double' | 'triple' | 'four' | 'dormitory';
export type RoomStatus = 'active' | 'inactive' | 'maintenance' | 'renovation';
export type BedStatus = 'vacant' | 'occupied' | 'reserved' | 'maintenance';
export type BathroomType = 'attached' | 'common' | 'shared';
export type BuildingStatus = 'active' | 'inactive' | 'under_construction' | 'maintenance';
export type FloorStatus = 'active' | 'inactive' | 'maintenance';

export type FloorLabel =
  | 'ground' | 'first' | 'second' | 'third' | 'fourth' | 'fifth'
  | 'sixth' | 'seventh' | 'eighth' | 'ninth' | 'tenth'
  | 'eleventh' | 'twelfth' | 'thirteenth' | 'fourteenth' | 'fifteenth'
  | 'terrace' | 'basement';

export interface RoomConfig {
  _id: string;
  shareType: ShareType;
  rent: number;
  depositAmount?: number;
  totalBeds?: number;
  availableBeds?: number;
  roomSize?: string;
  furnitureIncluded?: boolean;
  acIncluded?: boolean;
  bathroomType?: 'attached' | 'shared' | 'common-floor';
  amenities?: string[];
}

export interface PGPhoto {
  _id: string;
  url: string;
  publicId: string;
  caption?: string;
  isMain?: boolean;
  order?: number;
}

export interface RentSettings {
  dueDayOfMonth: number;
  lateFeePerDay: number;
  autoRemindWhatsApp: boolean;
  autoRemindEmail: boolean;
  remindDaysBefore: number;
}

export interface PG {
  _id: string;
  id: string;
  owner: string;
  name: string;
  description?: string;
  propertyType: PropertyType;
  city: string;
  area: string;
  address: string;
  fullAddress?: string;
  landmark?: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  roomConfigs: RoomConfig[];
  floors?: number;
  totalRooms?: number;
  gender: Gender;
  contactPhone: string;
  contactWhatsapp?: string;
  status: PGStatus;
  isVerified: boolean;
  photos: PGPhoto[];
  facilities: string[];
  ac: boolean;
  rentSettings: RentSettings;
  // Virtuals
  rent?: Record<string, number>;
  totalBeds?: number;
  availableBeds?: number;
  minRent?: number | null;
  maxRent?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Building {
  _id: string;
  id: string;
  pg: string;
  owner: string;
  name: string;
  description?: string;
  totalFloors: number;
  status: BuildingStatus;
  address?: string;
  stats?: {
    totalRooms: number;
    totalBeds: number;
    occupiedBeds: number;
    vacantBeds: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  _id: string;
  id: string;
  building: string;
  pg: string;
  owner: string;
  floorNumber: number;
  name?: string;
  status: FloorStatus;
  stats?: {
    totalRooms: number;
    totalBeds: number;
    occupiedBeds: number;
    vacantBeds: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  _id: string;
  id: string;
  floor?: string | Floor;
  building?: string | Building;
  pg: string;
  owner: string;
  roomNumber: string;
  shareType: ShareType;
  totalBeds?: number;
  rentPerBed?: number;
  rent?: number;
  deposit?: number;
  depositAmount?: number;
  status?: RoomStatus;
  amenities?: string[];
  occupiedBeds?: number;
  vacantBeds?: number;
  maintenanceBeds?: number;
  capacity?: number;
  roomSize?: string;
  bathroomType?: BathroomType;
  acIncluded?: boolean;
  ac?: boolean;
  attachedBathroom?: boolean;
  furnitureIncluded?: boolean;
  hasMeter?: boolean;
  floorLabel?: FloorLabel;
  image?: string | null;
  imagePublicId?: string | null;
  notes?: string;
  beds?: Bed[];
  createdAt: string;
  updatedAt: string;
}

export interface Bed {
  _id: string;
  id: string;
  room?: string | Room;
  floor?: string;
  building?: string;
  pg?: string;
  owner?: string;
  bedLabel: string;
  status: BedStatus;
  currentTenant?: string | { _id: string; name: string; phone?: string; checkInDate?: string; joinDate?: string } | null;
  tenant?: string | { _id: string; name: string; phone?: string; checkInDate?: string; joinDate?: string } | null;
  rentOverride?: number | null;
  notes?: string;
  lastVacatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuildingPayload {
  name: string;
  description?: string;
  totalFloors: number;
  status?: BuildingStatus;
  address?: string;
}

export type UpdateBuildingPayload = Partial<CreateBuildingPayload>;

export interface CreateFloorPayload {
  floorNumber: number;
  name?: string;
  status?: FloorStatus;
}

export type UpdateFloorPayload = Partial<CreateFloorPayload>;

export interface CreateRoomPayload {
  roomNumber: string;
  shareType: ShareType;
  rentPerBed: number;
  depositAmount?: number;
  acIncluded?: boolean;
  bathroomType?: BathroomType;
  amenities?: string[];
  notes?: string;
}

export interface CreatePGRoomPayload {
  roomNumber: string;
  floorLabel: FloorLabel;
  shareType: ShareType;
  rentPerBed?: number;
  rent: number;
  monthlyRent?: number;
  totalBeds?: number;
  deposit?: number;
  depositAmount?: number;
  roomSize?: string;
  ac?: boolean;
  acIncluded?: boolean;
  attachedBathroom?: boolean;
  bathroomType?: BathroomType;
  hasMeter?: boolean;
  amenities?: string[];
  notes?: string;
  image?: string | null;
  imagePublicId?: string | null;
}

export interface UpdateRoomPayload extends Partial<CreateRoomPayload> {
  roomNumber?: string;
  status?: RoomStatus;
  floorLabel?: FloorLabel;
  rent?: number;
  rentPerBed?: number;
  monthlyRent?: number;
  totalBeds?: number;
  depositAmount?: number;
  deposit?: number;
  roomSize?: string;
  ac?: boolean;
  acIncluded?: boolean;
  attachedBathroom?: boolean;
  bathroomType?: BathroomType;
  hasMeter?: boolean;
  amenities?: string[];
  notes?: string;
  image?: string | null;
  imagePublicId?: string | null;
}

export interface UpdateBedPayload {
  bedLabel?: string;
  status?: string;
  rentOverride?: number | null;
  notes?: string;
}

export interface CreatePropertyPayload {
  title: string;
  name?: string;
  category: 'pg';
  purpose?: 'rent';
  listedBy?: 'owner';
  city: string;
  area: string;
  address: string;
  fullAddress?: string;
  mapsLink?: string;
  googlePlaceId?: string;
  latitude?: number;
  longitude?: number;
  contactPhone: string;
  contactWhatsapp?: string;
  contactEmail?: string;
  pricing: {
    expectedPrice: number;
    securityDeposit?: number;
    maintenanceType?: 'included' | 'monthly_fixed' | 'per_sqft_monthly' | 'quarterly' | 'yearly' | 'none';
  };
  pgDetails: {
    propertySubtype?: 'PG' | 'Hostel' | 'Co-living' | 'Student Accommodation' | 'Working Men PG' | 'Working Women PG';
    gender?: Gender;
    food?: 'none' | 'veg' | 'nonveg' | 'both';
    foodIncluded?: boolean;
    ac?: boolean;
    isAvailable?: boolean;
    roomConfigs: Array<{
      shareType: ShareType;
      rent: number;
      monthlyRent?: number;
      totalBeds?: number;
      availableBeds?: number;
      bathroomType?: 'attached' | 'shared' | 'common-floor';
      furnitureIncluded?: boolean;
      acIncluded?: boolean;
    }>;
  };
  amenities?: string[];
  photos?: Array<{ url: string; publicId?: string; caption?: string; isMain?: boolean; order?: number }>;
}

