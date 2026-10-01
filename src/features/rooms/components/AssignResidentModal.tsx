'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BedDouble, User, Phone, Calendar, IndianRupee } from 'lucide-react';
import type { Bed, Room } from '@/types/property';
import type { AssignResidentPayload } from '../api/rooms.api';

interface AssignResidentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bed: Bed | null;
  room: Room | null;
  onSubmit: (payload: AssignResidentPayload) => Promise<void> | void;
  isPending: boolean;
}

export function AssignResidentModal({
  open,
  onOpenChange,
  bed,
  room,
  onSubmit,
  isPending,
}: AssignResidentModalProps) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    joinDate: new Date().toISOString().split('T')[0],
    monthlyRent: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && room) {
      setForm({
        name: '',
        phone: '',
        joinDate: new Date().toISOString().split('T')[0],
        monthlyRent: String(room.rentPerBed || room.rent || ''),
      });
      setErrors({});
    }
  }, [open, room]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errs: Record<string, string> = {};

      if (!form.name.trim()) {
        errs.name = 'Resident name is required';
      }
      if (!form.phone.trim()) {
        errs.phone = 'Phone number is required';
      } else if (!/^[6-9]\d{9}$/.test(form.phone.trim().replace(/\D/g, ''))) {
        errs.phone = 'Enter a valid 10-digit mobile number';
      }
      if (!form.joinDate) {
        errs.joinDate = 'Check-in date is required';
      }

      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }

      await onSubmit({
        name: form.name.trim(),
        phone: form.phone.trim().replace(/\D/g, ''),
        joinDate: form.joinDate,
        monthlyRent: form.monthlyRent ? parseFloat(form.monthlyRent) : undefined,
      });
    },
    [form, onSubmit]
  );

  const bedLabel = bed?.bedLabel || 'Bed';
  const roomNumber = room?.roomNumber || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-white shadow-2xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BedDouble className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Assign Resident
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Assigning to <span className="font-semibold text-emerald-400">{bedLabel}</span> in Room <span className="font-semibold text-white">{roomNumber}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Resident Name */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" />
              Resident Name *
            </label>
            <Input
              placeholder="e.g. Rahul Sharma"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 rounded-xl"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-400">{errors.name}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              Phone Number *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono font-medium">
                +91
              </span>
              <Input
                placeholder="98765 43210"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                maxLength={10}
                className="pl-12 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 rounded-xl font-mono"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs text-rose-400">{errors.phone}</p>
            )}
          </div>

          {/* Join Date & Monthly Rent */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Check-in Date *
              </label>
              <Input
                type="date"
                value={form.joinDate}
                onChange={(e) => handleChange('joinDate', e.target.value)}
                className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 rounded-xl text-sm [color-scheme:dark]"
              />
              {errors.joinDate && (
                <p className="mt-1 text-xs text-rose-400">{errors.joinDate}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                Monthly Rent (₹)
              </label>
              <Input
                type="number"
                placeholder="Rent"
                value={form.monthlyRent}
                onChange={(e) => handleChange('monthlyRent', e.target.value)}
                className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 rounded-xl font-mono"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950/40"
            >
              {isPending ? 'Assigning...' : 'Assign Resident'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
