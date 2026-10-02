'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/store';
import { Loader2 } from 'lucide-react';

/**
 * Root redirect page.
 * Waits for Zustand localStorage hydration before deciding where to navigate,
 * preventing a flash of redirect to /login for authenticated users.
 */
export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  // Track hydration: Zustand's persist middleware hydrates asynchronously
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // useAuthStore.persist.hasHydrated() is synchronously available after first render
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    // If already hydrated (e.g. fast rerender), mark immediately
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );
}
