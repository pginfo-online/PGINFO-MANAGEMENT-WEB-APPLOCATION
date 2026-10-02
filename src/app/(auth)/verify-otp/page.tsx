'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, ArrowLeft, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/lib/auth/store';
import { formatPhone } from '@/lib/utils';

// ─── OTP Input Component ───────────────────────────────────────────────────────
// 4 individual digit boxes for clear, mobile-friendly OTP entry

const OTP_LENGTH = 4;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

function OtpInput({ value, onChange, disabled, hasError }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '');

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1); // Only last digit
    const newValue = digits.map((d, i) => (i === index ? digit : d)).join('');
    onChange(newValue);

    // Auto-advance to next field
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        // Clear current digit
        const newValue = digits.map((d, i) => (i === index ? '' : d)).join('');
        onChange(newValue);
      } else if (index > 0) {
        // Move to previous if already empty
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted) {
      onChange(pasted.padEnd(OTP_LENGTH, '').slice(0, OTP_LENGTH).replace(/\s/g, ''));
      // Focus last filled or last box
      const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center gap-3 justify-center">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`OTP digit ${index + 1}`}
          className="h-14 w-14 rounded-xl border-2 text-center text-2xl font-bold font-mono transition-all outline-none disabled:opacity-50"
          style={{
            backgroundColor: 'var(--bg-input)',
            color: digit ? 'var(--emerald-accent)' : 'var(--text-main)',
            borderColor: hasError
              ? 'var(--rose)'
              : digit
              ? 'var(--emerald-accent)'
              : 'var(--border-main)',
            boxShadow: digit && !hasError
              ? '0 0 0 2px color-mix(in srgb, var(--emerald-accent) 20%, transparent)'
              : undefined,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main OTP Verification Content ────────────────────────────────────────────

const RESEND_COOLDOWN = 30;

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contact = searchParams.get('contact') || '';
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const setAuth = useAuthStore((s) => s.setAuth);
  const setTempToken = useAuthStore((s) => s.setTempToken);

  // Guard: no contact param → back to login
  useEffect(() => {
    if (!contact) {
      router.replace('/login');
    }
  }, [contact, router]);

  // Countdown timer using interval (not nested setTimeout with state dep)
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount; inner closure handles decrement

  // Clear error when user changes OTP
  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (error) setError(null);
  };

  const handleVerify = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (otp.length < OTP_LENGTH) {
      setError(`Please enter the full ${OTP_LENGTH}-digit verification code`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.verifyOtp({
        contact,
        otp: otp.trim(),
        isMobile: false,
      });

      if (response.data.isNewUser) {
        setTempToken(response.data.tempToken);
        await router.push(`/register?phone=${encodeURIComponent(contact)}`);
      } else {
        const { user, token } = response.data;
        // Set auth with basic data first
        setAuth(user, token);

        // Enrich with capabilities in background (non-blocking)
        authApi.getMe().then((meRes) => {
          if (meRes.data) {
            setAuth(
              meRes.data.user ?? user,
              token,
              meRes.data.capabilities,
              meRes.data.availableModes
            );
          }
        }).catch(() => {
          // Capabilities fetch failed — auth is still valid, continue
        });

        await router.push(redirectTo);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Invalid or expired verification code. Please try again.';
      setError(msg);
      setIsLoading(false);
    }
    // Do NOT reset isLoading on success — navigating away
  }, [otp, contact, redirectTo, setAuth, setTempToken, router]);

  // Auto-submit when all 4 digits are filled
  useEffect(() => {
    if (otp.length === OTP_LENGTH && !isLoading) {
      handleVerify();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setError(null);
    setSuccessMsg(null);
    setIsResending(true);
    setOtp('');

    try {
      await authApi.sendOtp({
        contact,
        type: 'phone',
        sendWhatsApp: true,
      });
      setCountdown(RESEND_COOLDOWN);
      setSuccessMsg('A new code has been sent.');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to resend code. Please try again.';
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  if (!contact) {
    // Graceful fallback while redirect is in progress
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
      {/* Decorative Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-10 h-[300px] w-[350px] rounded-full bg-teal-500/8 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-sub)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Change mobile number</span>
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-xl shadow-emerald-950/60 ring-1 ring-emerald-400/30">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Verify Your Number
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            We sent a {OTP_LENGTH}-digit code to{' '}
            <span className="font-semibold" style={{ color: 'var(--text-sub)' }}>
              {formatPhone(contact)}
            </span>
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-6 sm:p-8 backdrop-blur-xl shadow-2xl"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-main)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <form onSubmit={handleVerify} className="space-y-6" noValidate>
            <div>
              <label className="mb-4 block text-center text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-sub)' }}>
                Enter {OTP_LENGTH}-Digit Verification Code
              </label>

              <OtpInput
                value={otp}
                onChange={handleOtpChange}
                disabled={isLoading}
                hasError={Boolean(error)}
              />

              {/* Error message */}
              {error && (
                <p className="mt-3 text-center text-xs font-medium" style={{ color: 'var(--rose)' }}>
                  {error}
                </p>
              )}

              {/* Success message (after resend) */}
              {successMsg && !error && (
                <p className="mt-3 text-center text-xs font-medium" style={{ color: 'var(--emerald-accent)' }}>
                  {successMsg}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              isLoading={isLoading}
              disabled={isLoading || otp.length < OTP_LENGTH}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              <span>Verify &amp; Continue</span>
            </Button>
          </form>

          {/* Resend section */}
          <div
            className="mt-6 flex items-center justify-between text-xs pt-4"
            style={{ borderTop: '1px solid var(--border-main)', color: 'var(--text-muted)' }}
          >
            <span>Didn&apos;t receive the code?</span>
            {countdown > 0 ? (
              <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
                Resend in {countdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center gap-1 font-semibold transition-colors disabled:opacity-50"
                style={{ color: 'var(--emerald-accent)' }}
                onMouseEnter={(e) => !isResending && (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <RefreshCw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} />
                <span>{isResending ? 'Sending…' : 'Resend Code'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Security footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <ShieldCheck className="h-4 w-4" />
          <span>Encrypted token authentication</span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
