'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Save,
  CreditCard,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { rentApi } from '@/features/rent/api/rent.api';
import type { RentSettings } from '@/types/rent';

interface SettingsFormProps {
  propertyId: string;
  initialSettings?: RentSettings;
}

function SettingsForm({ propertyId, initialSettings }: SettingsFormProps) {
  const queryClient = useQueryClient();

  const [dueDayOfMonth, setDueDayOfMonth] = useState(
    initialSettings?.dueDayOfMonth !== undefined
      ? String(initialSettings.dueDayOfMonth)
      : '5'
  );
  const [gracePeriodDays, setGracePeriodDays] = useState(
    initialSettings?.gracePeriodDays !== undefined
      ? String(initialSettings.gracePeriodDays)
      : '3'
  );
  const [lateFeePerDay, setLateFeePerDay] = useState(
    initialSettings?.lateFeePerDay !== undefined
      ? String(initialSettings.lateFeePerDay)
      : '50'
  );
  const [autoRemindWhatsApp, setAutoRemindWhatsApp] = useState(
    initialSettings?.autoRemindWhatsApp !== undefined
      ? initialSettings.autoRemindWhatsApp
      : true
  );
  const [remindDaysBeforeDue, setRemindDaysBeforeDue] = useState(
    initialSettings?.remindDaysBeforeDue !== undefined
      ? String(initialSettings.remindDaysBeforeDue)
      : '2'
  );
  const [upiId, setUpiId] = useState(initialSettings?.upiId || '');
  const [accountName, setAccountName] = useState(initialSettings?.accountName || '');
  const [accountNumber, setAccountNumber] = useState(initialSettings?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(initialSettings?.ifscCode || '');

  const [successMessage, setSuccessMessage] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<RentSettings>) =>
      rentApi.updateRentSettings(propertyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rent-settings', propertyId] });
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3000);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      dueDayOfMonth: parseInt(dueDayOfMonth, 10) || 5,
      gracePeriodDays: parseInt(gracePeriodDays, 10) || 3,
      lateFeePerDay: parseFloat(lateFeePerDay) || 0,
      autoRemindWhatsApp,
      remindDaysBeforeDue: parseInt(remindDaysBeforeDue, 10) || 2,
      upiId: upiId.trim() || undefined,
      accountName: accountName.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      ifscCode: ifscCode.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSave} className="mt-8 max-w-3xl space-y-8">
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>Settings updated successfully!</span>
        </div>
      )}

      {/* Rent Due Cycle & Late Fees */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <Receipt className="h-5 w-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-white">Billing & Due Rules</h3>
            <p className="text-xs text-slate-400">
              Configure default billing schedule for invoice generation.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-300">
              Due Day of Month
            </label>
            <Input
              type="number"
              min="1"
              max="31"
              value={dueDayOfMonth}
              onChange={(e) => setDueDayOfMonth(e.target.value)}
              required
              className="mt-1 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">E.g. 5th of each month</p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-slate-300">
              Grace Period (Days)
            </label>
            <Input
              type="number"
              min="0"
              max="15"
              value={gracePeriodDays}
              onChange={(e) => setGracePeriodDays(e.target.value)}
              required
              className="mt-1 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">Days before late fees start</p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-slate-300">
              Late Fee per Day (₹)
            </label>
            <Input
              type="number"
              min="0"
              value={lateFeePerDay}
              onChange={(e) => setLateFeePerDay(e.target.value)}
              required
              className="mt-1 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">Accumulated daily</p>
          </div>
        </div>
      </div>

      {/* Automated Reminders */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <MessageSquare className="h-5 w-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-white">Automated WhatsApp Reminders</h3>
            <p className="text-xs text-slate-400">
              Keep collections on track with scheduled automated tenant notifications.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRemindWhatsApp}
              onChange={(e) => setAutoRemindWhatsApp(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500"
            />
            <span className="text-sm font-medium text-slate-200">
              Enable automated WhatsApp payment reminders before invoice due date
            </span>
          </label>

          <div className="max-w-xs pt-2">
            <label className="text-xs font-semibold uppercase text-slate-300">
              Remind Days in Advance
            </label>
            <Input
              type="number"
              min="1"
              max="10"
              value={remindDaysBeforeDue}
              onChange={(e) => setRemindDaysBeforeDue(e.target.value)}
              className="mt-1 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Send reminder notice 2 days prior to due date
            </p>
          </div>
        </div>
      </div>

      {/* Bank Account & UPI Settlement */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <CreditCard className="h-5 w-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-white">Payment Settlement Details</h3>
            <p className="text-xs text-slate-400">
              Provide your UPI ID or Bank details for resident payments.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-300">
              UPI ID (VPA)
            </label>
            <Input
              placeholder="e.g. pgowner@okhdfcbank"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="mt-1 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-300">
                Account Holder Name
              </label>
              <Input
                placeholder="e.g. Ramesh Kumar"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-300">
                Bank Account Number
              </label>
              <Input
                placeholder="Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="mt-1 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-300">
                IFSC Code
              </label>
              <Input
                placeholder="e.g. HDFC0001234"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value)}
                className="mt-1 font-mono uppercase"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="lg"
          isLoading={updateMutation.isPending}
          className="px-8 font-semibold"
        >
          <Save className="h-4 w-4 mr-2" />
          <span>Save Changes</span>
        </Button>
      </div>
    </form>
  );
}

export default function PropertySettingsPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;

  const { data, isLoading } = useQuery({
    queryKey: ['rent-settings', propertyId],
    queryFn: () => rentApi.getRentSettings(propertyId),
    enabled: !!propertyId,
  });

  return (
    <DashboardLayout propertyId={propertyId}>
      <PageHeader
        title="Property & Rent Settings"
        description="Configure billing cycles, automated WhatsApp reminder intervals, and rent collection bank details."
        breadcrumbs={[
          { label: 'Properties', href: '/dashboard' },
          { label: 'Overview', href: `/properties/${propertyId}` },
          { label: 'Settings' },
        ]}
      />

      {isLoading ? (
        <div className="mt-8 max-w-3xl space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        <SettingsForm
          key={propertyId}
          propertyId={propertyId}
          initialSettings={data?.data}
        />
      )}
    </DashboardLayout>
  );
}
