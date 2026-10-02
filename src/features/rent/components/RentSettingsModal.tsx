'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Calendar,
  AlertTriangle,
  MessageCircle,
  Mail,
  Clock,
  Loader2,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { rentApi } from '../api/rent.api';
import { useToast } from '@/components/ui/toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RentSettings } from '@/types/rent';

interface RentSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
}

export function RentSettingsModal({
  open,
  onOpenChange,
  propertyId,
}: RentSettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['rent-settings', propertyId],
    queryFn: () => rentApi.getRentSettings(propertyId),
    enabled: open && !!propertyId,
  });

  const settings = settingsData?.data;

  const [dueDay, setDueDay] = useState('5');
  const [lateFee, setLateFee] = useState('50');
  const [gracePeriod, setGracePeriod] = useState('2');
  const [autoRemindWhatsApp, setAutoRemindWhatsApp] = useState(true);
  const [autoRemindEmail, setAutoRemindEmail] = useState(false);
  const [remindDaysBefore, setRemindDaysBefore] = useState('2');

  useEffect(() => {
    if (settings) {
      if (settings.dueDayOfMonth !== undefined) setDueDay(String(settings.dueDayOfMonth));
      if (settings.lateFeePerDay !== undefined) setLateFee(String(settings.lateFeePerDay));
      if (settings.gracePeriodDays !== undefined) setGracePeriod(String(settings.gracePeriodDays));
      if (settings.autoRemindWhatsApp !== undefined) setAutoRemindWhatsApp(Boolean(settings.autoRemindWhatsApp));
      if (settings.autoRemindEmail !== undefined) setAutoRemindEmail(Boolean(settings.autoRemindEmail));
      if (settings.remindDaysBeforeDue !== undefined) setRemindDaysBefore(String(settings.remindDaysBeforeDue));
      else if (settings.remindDaysBefore !== undefined) setRemindDaysBefore(String(settings.remindDaysBefore));
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<RentSettings>) => rentApi.updateRentSettings(propertyId, data),
    onSuccess: () => {
      toast.success('Rent Settings Saved! ⚙️', 'Property rent billing and reminder preferences updated.');
      queryClient.invalidateQueries({ queryKey: ['rent-settings', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error('Failed to Save Settings', err.message || 'Please check your inputs.');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      dueDayOfMonth: parseInt(dueDay, 10) || 5,
      lateFeePerDay: parseInt(lateFee, 10) || 0,
      gracePeriodDays: parseInt(gracePeriod, 10) || 0,
      autoRemindWhatsApp,
      autoRemindEmail,
      remindDaysBeforeDue: parseInt(remindDaysBefore, 10) || 2,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-[var(--border-main)] dark:border-slate-800 text-[var(--text-main)] dark:text-white p-0 overflow-hidden rounded-2xl shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-[var(--border-main)] dark:border-slate-800/80 bg-[var(--bg-card-subtle)] dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[var(--text-main)] dark:text-white">
                Rent Collection Settings
              </DialogTitle>
              <p className="text-xs text-[var(--text-muted)] dark:text-slate-400 mt-0.5">
                Default billing cycles, late fees, and auto-reminders
              </p>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1 block">
                  Due Day of Month
                </label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  className="font-mono bg-white dark:bg-slate-950/80 border-[var(--border-main)] dark:border-slate-800"
                />
                <p className="text-[10px] text-[var(--text-muted)] dark:text-slate-500 mt-0.5">
                  e.g. 5th of every month
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1 block">
                  Grace Period (Days)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(e.target.value)}
                  className="font-mono bg-white dark:bg-slate-950/80 border-[var(--border-main)] dark:border-slate-800"
                />
                <p className="text-[10px] text-[var(--text-muted)] dark:text-slate-500 mt-0.5">
                  Days before late fee applies
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1 block">
                Late Fee per Day (₹)
              </label>
              <Input
                type="number"
                min="0"
                value={lateFee}
                onChange={(e) => setLateFee(e.target.value)}
                className="font-mono bg-white dark:bg-slate-950/80 border-[var(--border-main)] dark:border-slate-800"
              />
              <p className="text-[10px] text-[var(--text-muted)] dark:text-slate-500 mt-0.5">
                Added daily to unpaid balance after grace period
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-[var(--border-main)] dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 block">
                Automatic Reminders
              </span>

              <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-main)] dark:border-slate-800 bg-[var(--bg-card-subtle)] dark:bg-slate-950/60 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="h-4 w-4 text-emerald-500" />
                  <div>
                    <span className="text-xs font-semibold text-[var(--text-main)] dark:text-white block">
                      Auto WhatsApp Reminders
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] dark:text-slate-400 block">
                      Dispatch reminders before and on due date
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoRemindWhatsApp}
                  onChange={(e) => setAutoRemindWhatsApp(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-main)] dark:border-slate-800 bg-[var(--bg-card-subtle)] dark:bg-slate-950/60 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-sky-500" />
                  <div>
                    <span className="text-xs font-semibold text-[var(--text-main)] dark:text-white block">
                      Auto Email Invoices
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] dark:text-slate-400 block">
                      Email PDF bill to residents with registered email
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoRemindEmail}
                  onChange={(e) => setAutoRemindEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            </div>

            <DialogFooter className="pt-4 border-t border-[var(--border-main)] dark:border-slate-800/80 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                <span>Save Settings</span>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
