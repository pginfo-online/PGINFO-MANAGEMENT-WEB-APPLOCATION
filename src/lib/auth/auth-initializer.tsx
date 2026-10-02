'use client';

import { useAuthInit } from './use-auth-init';

/**
 * Invisible client component that runs session validation on mount.
 * Placed once in the root layout so it runs on every page load.
 */
export function AuthInitializer() {
  useAuthInit();
  return null;
}
