import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Capability, AvailableMode } from '@/types/auth';

// Cookie options — shared between set and clear helpers
const COOKIE_NAME = 'pg_auth_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

function setAuthCookie(token: string): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

function clearAuthCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

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
        setAuthCookie(token);
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
        clearAuthCookie();
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
      // Persist everything except tempToken (it's short-lived and security-sensitive)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        capabilities: state.capabilities,
        availableModes: state.availableModes,
        activePropertyId: state.activePropertyId,
        isAuthenticated: state.isAuthenticated,
      }),
      // After rehydration, re-sync the cookie with the persisted token
      onRehydrateStorage: () => (state) => {
        if (state?.token && state.isAuthenticated) {
          setAuthCookie(state.token);
        }
      },
    }
  )
);
