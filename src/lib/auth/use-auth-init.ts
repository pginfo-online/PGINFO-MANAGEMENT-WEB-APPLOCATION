'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from './store';
import { authApi } from '@/features/auth/api/auth.api';

/**
 * Validates the persisted session on app load.
 * If the stored token is expired/invalid, clears auth state so the user
 * is redirected to login. Call this once in the root layout (client component).
 */
export function useAuthInit() {
  const { isAuthenticated, token, setAuth, clearAuth } = useAuthStore();
  const hasValidated = useRef(false);

  useEffect(() => {
    // Only validate once per mount, and only if we think we're authenticated
    if (hasValidated.current || !isAuthenticated || !token) return;
    hasValidated.current = true;

    authApi
      .getMe()
      .then((res) => {
        if (res.data?.user) {
          // Refresh auth state with latest user/capabilities from server
          setAuth(
            res.data.user,
            token,
            res.data.capabilities,
            res.data.availableModes
          );
        }
      })
      .catch(() => {
        // Token is invalid or expired — clear state so middleware redirects to login
        clearAuth();
      });
  }, [isAuthenticated, token, setAuth, clearAuth]);
}
