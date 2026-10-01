'use client';

import React, { useState, Suspense } from 'react';
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
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete registration.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#080c14] px-4 py-12">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-xl shadow-emerald-950/60 ring-1 ring-emerald-400/30">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
            Set Up Your Owner Profile
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Complete your registration to access the PG management portal.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Full Name
              </label>
              <div className="mt-2">
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<User className="h-4 w-4" />}
                  error={error || undefined}
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              isLoading={isLoading}
            >
              <span>Complete Setup & Enter</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          <span>PGinfo Enterprise Verification</span>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080c14]" />}>
      <RegisterContent />
    </Suspense>
  );
}
