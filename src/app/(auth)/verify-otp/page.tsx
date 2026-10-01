'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, ArrowLeft, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/lib/auth/store';
import { formatPhone } from '@/lib/utils';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contact = searchParams.get('contact') || '';

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState<string | null>(null);

  const setAuth = useAuthStore((s) => s.setAuth);
  const setTempToken = useAuthStore((s) => s.setTempToken);

  useEffect(() => {
    if (!contact) {
      router.replace('/login');
      return;
    }

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, contact, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.verifyOtp({
        contact,
        otp: cleanOtp,
        isMobile: false,
      });

      if (response.data.isNewUser) {
        setTempToken(response.data.tempToken);
        router.push(`/register?phone=${encodeURIComponent(contact)}`);
      } else {
        const { user, token } = response.data;
        setAuth(user, token);

        // Fetch auth context capabilities in background
        try {
          const meRes = await authApi.getMe();
          if (meRes.data) {
            setAuth(
              meRes.data.user || user,
              token,
              meRes.data.capabilities,
              meRes.data.availableModes
            );
          }
        } catch {
          // ignore background me failure
        }

        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired verification code';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setError(null);
    setIsResending(true);

    try {
      await authApi.sendOtp({
        contact,
        type: 'phone',
        sendWhatsApp: true,
      });
      setCountdown(30);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend code. Please try again.';
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#080c14] px-4 py-12">
      {/* Decorative Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={() => router.push('/login')}
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Change mobile number</span>
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-xl shadow-emerald-950/60 ring-1 ring-emerald-400/30">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
            Verify Your Number
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            We sent a verification code to{' '}
            <span className="font-semibold text-slate-200">{formatPhone(contact)}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label
                htmlFor="otp"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                6-Digit Verification Code
              </label>
              <div className="mt-2">
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  error={error || undefined}
                  className="h-12 text-center font-mono text-2xl tracking-[0.5em] text-emerald-400 placeholder:text-slate-600"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              isLoading={isLoading}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              <span>Verify & Continue</span>
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4">
            <span>Didn&apos;t receive the code?</span>
            {countdown > 0 ? (
              <span className="font-mono text-slate-400">Resend in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          <span>Encrypted token authentication</span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080c14]" />}>
      <VerifyOtpContent />
    </Suspense>
  );
}
