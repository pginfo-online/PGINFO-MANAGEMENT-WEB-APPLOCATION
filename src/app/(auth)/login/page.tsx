'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Phone, MessageSquare, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/lib/auth/store';
import { Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [phone, setPhone] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: already authenticated → redirect to intended destination
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.sendOtp({
        contact: cleanPhone,
        type: 'phone',
        sendWhatsApp,
      });

      // Navigate to OTP verification — router.push returns a promise in Next.js 15
      await router.push(`/verify-otp?contact=${encodeURIComponent(cleanPhone)}&redirect=${encodeURIComponent(redirectTo)}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to send verification code. Please try again.';
      setError(msg);
      setIsLoading(false);
    }
    // Note: do NOT call setIsLoading(false) on success — page is navigating away
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--bg-app)' }}>

      {/* Background Decorative Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-10 h-[350px] w-[400px] rounded-full bg-teal-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-xl shadow-emerald-950/60 ring-1 ring-emerald-400/30">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: 'var(--text-main)' }}>
            PGinfo Owner Portal
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Enterprise property management for PG &amp; hostel owners.
          </p>
        </div>

        {/* Login Card */}
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
                htmlFor="phone"
                className="block text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-sub)' }}
              >
                Mobile Number
              </label>
              <div className="mt-2 flex items-center gap-2">
                {/* Country code badge */}
                <div
                  className="flex h-10 flex-shrink-0 items-center justify-center rounded-lg border px-3 text-sm font-medium"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-main)',
                    color: 'var(--text-sub)',
                  }}
                >
                  +91
                </div>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={handlePhoneChange}
                  icon={<Phone className="h-4 w-4" />}
                  error={error || undefined}
                  maxLength={10}
                  className="font-mono text-base"
                  autoComplete="tel-national"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* WhatsApp toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="sendWhatsApp"
                type="checkbox"
                checked={sendWhatsApp}
                onChange={(e) => setSendWhatsApp(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                disabled={isLoading}
              />
              <label
                htmlFor="sendWhatsApp"
                className="flex cursor-pointer select-none items-center gap-1.5 text-xs"
                style={{ color: 'var(--text-sub)' }}
              >
                <MessageSquare className="h-3.5 w-3.5" style={{ color: 'var(--emerald-accent)' }} />
                <span>Receive login OTP via WhatsApp</span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              isLoading={isLoading}
              disabled={isLoading || phone.length !== 10}
            >
              <span>Send Verification Code</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          {/* Feature Highlights */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border-main)' }}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Included with Owner Access:
            </p>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--text-sub)' }}>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--emerald-accent)' }} />
                <span>Multi-building room &amp; bed allocation matrix</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--emerald-accent)' }} />
                <span>Automated WhatsApp rent collection &amp; reminders</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--emerald-accent)' }} />
                <span>Real-time occupancy tracking and financial P&amp;L</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <ShieldCheck className="h-4 w-4" />
          <span>Encrypted 256-bit secure session verification</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
