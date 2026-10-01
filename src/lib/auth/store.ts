import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Capability, AvailableMode } from '@/types/auth';

interface AuthStoreState {
  user: User | null;
  token: string | null;
  tempToken: string | null;
  capabilities: Capability[];
  availableModes: AvailableMode[];
  activePropertyId: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string, capabilities?: Capability[], availableModes?: AvailableMode[]) => void;
  setTempToken: (tempToken: string | null) => void;
  setActivePropertyId: (id: string | null) => void;
  updateUser: (partial: Partial<User>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      tempToken: null,
      capabilities: [],
      availableModes: [],
      activePropertyId: null,
      isAuthenticated: false,

      setAuth: (user, token, capabilities = [], availableModes = []) => {
        if (typeof document !== 'undefined') {
          // Set cookie for Next.js SSR / middleware access
          document.cookie = `pg_auth_token=${token}; path=/; max-age=604800; SameSite=Lax`;
        }
        set({
          user,
          token,
          capabilities,
          availableModes,
          isAuthenticated: true,
          tempToken: null,
        });
      },

      setTempToken: (tempToken) => set({ tempToken }),

      setActivePropertyId: (id) => set({ activePropertyId: id }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      clearAuth: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'pg_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        }
        set({
          user: null,
          token: null,
          tempToken: null,
          capabilities: [],
          availableModes: [],
          activePropertyId: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'pg_owner_auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        tempToken: state.tempToken,
        capabilities: state.capabilities,
        availableModes: state.availableModes,
        activePropertyId: state.activePropertyId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
