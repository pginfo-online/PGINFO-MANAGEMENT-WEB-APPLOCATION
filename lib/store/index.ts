import { create } from "zustand";

interface PropertyState {
  selectedPropertyId: string | null; // null represents all properties
  selectedPropertyIds: string[];
  activePropertyName: string;
  setSelectedPropertyId: (id: string | null, name?: string) => void;
  toggleProperty: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearAll: () => void;
}

export const usePropertyStore = create<PropertyState>((set) => ({
  selectedPropertyId: null,
  selectedPropertyIds: [],
  activePropertyName: "All Properties",
  setSelectedPropertyId: (id, name) =>
    set({
      selectedPropertyId: id,
      activePropertyName: name || (id ? "Selected Property" : "All Properties"),
    }),
  toggleProperty: (id) =>
    set((state) => {
      const exists = state.selectedPropertyIds.includes(id);
      const next = exists
        ? state.selectedPropertyIds.filter((p) => p !== id)
        : [...state.selectedPropertyIds, id];
      return {
        selectedPropertyIds: next,
        selectedPropertyId: next.length === 1 ? next[0] : null,
      };
    }),
  selectAll: (ids) =>
    set({
      selectedPropertyIds: ids,
      selectedPropertyId: null,
      activePropertyName: "All Properties",
    }),
  clearAll: () =>
    set({
      selectedPropertyIds: [],
      selectedPropertyId: null,
      activePropertyName: "All Properties",
    }),
}));

interface UiState {
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  isPropertySelectorOpen: boolean;
  setPropertySelectorOpen: (open: boolean) => void;

  isAddRentDuesOpen: boolean;
  setAddRentDuesOpen: (open: boolean) => void;
  selectedTenantForDue: any | null;
  setSelectedTenantForDue: (tenant: any | null) => void;

  isReceivePaymentOpen: boolean;
  setReceivePaymentOpen: (open: boolean) => void;
  selectedResidentForPayment: any | null;
  setSelectedResidentForPayment: (resident: any | null) => void;

  isAddExpenseOpen: boolean;
  setAddExpenseOpen: (open: boolean) => void;

  isAddComplaintOpen: boolean;
  setAddComplaintOpen: (open: boolean) => void;

  isAnnouncementsOpen: boolean;
  setAnnouncementsOpen: (open: boolean) => void;

  isAddRoomOpen: boolean;
  setAddRoomOpen: (open: boolean) => void;

  isAddStaffOpen: boolean;
  setAddStaffOpen: (open: boolean) => void;

  isAddPropertyOpen: boolean;
  setAddPropertyOpen: (open: boolean) => void;

  // Edit room modal state
  isEditRoomOpen: boolean;
  selectedRoomForEdit: any | null;
  setEditRoomOpen: (open: boolean, room?: any) => void;

  // Room details right drawer state
  isRoomDrawerOpen: boolean;
  selectedRoomForDrawer: any | null;
  setRoomDrawerOpen: (open: boolean, room?: any) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSearchOpen: false,
  setSearchOpen: (open) => set({ isSearchOpen: open }),

  isPropertySelectorOpen: false,
  setPropertySelectorOpen: (open) => set({ isPropertySelectorOpen: open }),

  isAddPropertyOpen: false,
  setAddPropertyOpen: (open) => set({ isAddPropertyOpen: open }),

  isEditRoomOpen: false,
  selectedRoomForEdit: null,
  setEditRoomOpen: (open, room = null) =>
    set({ isEditRoomOpen: open, selectedRoomForEdit: room }),

  isRoomDrawerOpen: false,
  selectedRoomForDrawer: null,
  setRoomDrawerOpen: (open, room = null) =>
    set({ isRoomDrawerOpen: open, selectedRoomForDrawer: room }),

  isAddRentDuesOpen: false,
  setAddRentDuesOpen: (open) => set({ isAddRentDuesOpen: open }),
  selectedTenantForDue: null,
  setSelectedTenantForDue: (tenant) =>
    set({ selectedTenantForDue: tenant, isAddRentDuesOpen: !!tenant }),

  isReceivePaymentOpen: false,
  setReceivePaymentOpen: (open) => set({ isReceivePaymentOpen: open }),
  selectedResidentForPayment: null,
  setSelectedResidentForPayment: (res) =>
    set({ selectedResidentForPayment: res, isReceivePaymentOpen: !!res }),

  isAddExpenseOpen: false,
  setAddExpenseOpen: (open) => set({ isAddExpenseOpen: open }),

  isAddComplaintOpen: false,
  setAddComplaintOpen: (open) => set({ isAddComplaintOpen: open }),

  isAnnouncementsOpen: false,
  setAnnouncementsOpen: (open) => set({ isAnnouncementsOpen: open }),

  isAddRoomOpen: false,
  setAddRoomOpen: (open) => set({ isAddRoomOpen: open }),

  isAddStaffOpen: false,
  setAddStaffOpen: (open) => set({ isAddStaffOpen: open }),
}));
