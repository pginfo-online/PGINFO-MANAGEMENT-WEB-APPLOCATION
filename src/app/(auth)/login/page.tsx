'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Phone, MessageSquare, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/features/auth/api/auth.api';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Navigate to OTP verification with contact param
      router.push(`/verify-otp?contact=${encodeURIComponent(cleanPhone)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification code. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#080c14] px-4 py-12">
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
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            PGinfo Owner Portal
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Enterprise property management for PG & hostel owners.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Mobile Number
              </label>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-10 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800/80 px-3 text-sm font-medium text-slate-300">
                  +91
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  icon={<Phone className="h-4 w-4" />}
                  error={error || undefined}
                  maxLength={10}
                  className="font-mono text-base"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="sendWhatsApp"
                type="checkbox"
                checked={sendWhatsApp}
                onChange={(e) => setSendWhatsApp(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
              />
              <label
                htmlFor="sendWhatsApp"
                className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none"
              >
                <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                <span>Receive login OTP via WhatsApp</span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              isLoading={isLoading}
            >
              <span>Send Verification Code</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          {/* Feature Highlights */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Included with Owner Access:
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Multi-building room & bed allocation matrix</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Automated WhatsApp rent collection & reminders</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Real-time occupancy tracking and financial P&L</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          <span>Encrypted 256-bit secure session verification</span>
        </div>
      </div>
    </div>
  );
}
