'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/lib/auth/store';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';

  const tempToken = useAuthStore((s) => s.tempToken);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: no tempToken means user navigated here directly or session expired
  useEffect(() => {
    if (!tempToken) {
      router.replace('/login');
    }
  }, [tempToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tempToken) {
      setError('Registration token expired. Please start over from login.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.registerComplete({
        tempToken,
        name: name.trim(),
        phone: phone || undefined,
      });

      const { user, token } = response.data;
      setAuth(user, token);
      await router.push('/dashboard');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to complete registration. Please try again.';
      setError(msg);
      setIsLoading(false);
    }
  };

  if (!tempToken) {
    // Graceful loading state while redirect is in progress
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--bg-app)' }}
    >
      {/* Decorative gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-xl shadow-emerald-950/60 ring-1 ring-emerald-400/30">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Set Up Your Owner Profile
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Complete your registration to access the PG management portal.
          </p>
        </div>

        <div
          className="rounded-2xl border p-6 sm:p-8 backdrop-blur-xl shadow-2xl"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-main)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-sub)' }}
              >
                Full Name
              </label>
              <div className="mt-2">
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  icon={<User className="h-4 w-4" />}
                  error={error || undefined}
                  autoComplete="name"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              isLoading={isLoading}
              disabled={isLoading || !name.trim()}
            >
              <span>Complete Setup &amp; Enter</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <ShieldCheck className="h-4 w-4" />
          <span>PGinfo Enterprise Verification</span>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
