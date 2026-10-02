'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPhone } from '@/lib/utils';
import type { Tenant, UpdateTenantPayload, TenantStatus, Profession, FoodPreference, DepositStatus } from '@/types/tenant';

interface EditTenantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
  onSubmit: (id: string, payload: UpdateTenantPayload) => Promise<void> | void;
  isPending?: boolean;
}

export function EditTenantModal({
  open,
  onOpenChange,
  tenant,
  onSubmit,
  isPending = false,
}: EditTenantModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    profession: 'working_professional' as Profession,
    status: 'active' as TenantStatus,
    monthlyRent: '',
    securityDeposit: '',
    depositStatus: 'received' as DepositStatus,
    noticePeriodDays: 30,
    expectedLeaveDate: '',
    foodPreference: 'veg' as FoodPreference,
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && tenant) {
      setFormData({
        name: tenant.name || '',
        phone: tenant.phone || '',
        email: tenant.email || '',
        profession: (tenant.profession as Profession) || 'working_professional',
        status: tenant.status || 'active',
        monthlyRent: String(tenant.monthlyRent || tenant.rentAmount || ''),
        securityDeposit: String(tenant.securityDeposit || 0),
        depositStatus: tenant.depositStatus || 'received',
        noticePeriodDays: tenant.noticePeriodDays || 30,
        expectedLeaveDate: tenant.expectedLeaveDate
          ? new Date(tenant.expectedLeaveDate).toISOString().split('T')[0]
          : '',
        foodPreference: tenant.foodPreference || 'veg',
        emergencyName: tenant.emergencyContact?.name || tenant.emergencyContactName || '',
        emergencyRelation: tenant.emergencyContact?.relationship || 'Guardian',
        emergencyPhone: tenant.emergencyContact?.phone || tenant.emergencyContactPhone || '',
        notes: tenant.notes || '',
      });
      setErrors({});
    }
  }, [open, tenant]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    const cleanPhone = formData.phone.trim().replace(/\D/g, '');
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Valid 10-digit mobile number required';
    }
    const rent = parseFloat(formData.monthlyRent);
    if (isNaN(rent) || rent < 0) {
      newErrors.monthlyRent = 'Monthly rent cannot be negative';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: UpdateTenantPayload = {
      name: formData.name.trim(),
      phone: cleanPhone,
      email: formData.email.trim() || undefined,
      profession: formData.profession,
      status: formData.status,
      monthlyRent: rent,
      securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : 0,
      depositStatus: formData.depositStatus,
      noticePeriodDays: Number(formData.noticePeriodDays) || 30,
      expectedLeaveDate: formData.expectedLeaveDate || null,
      foodPreference: formData.foodPreference,
      notes: formData.notes.trim() || undefined,
      emergencyContact: (formData.emergencyName || formData.emergencyPhone)
        ? {
            name: formData.emergencyName.trim(),
            relationship: formData.emergencyRelation,
            phone: formData.emergencyPhone.trim().replace(/\D/g, ''),
          }
        : undefined,
    };

    await onSubmit(tenant._id, payload);
  };

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-2xl">
        <div className="border-b border-[var(--line)] p-5 bg-[var(--card-subtle)]">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[var(--ink)]">
              Edit Resident Profile: {tenant.name}
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                Full Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                Mobile Number *
              </label>
              <Input
                type="tel"
                maxLength={10}
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="font-mono"
                error={errors.phone}
              />
              {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Email & Profession */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                Profession
              </label>
              <select
                value={formData.profession}
                onChange={(e) => handleChange('profession', e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)]"
              >
                <option value="working_professional">Working Professional</option>
                <option value="student">Student</option>
                <option value="self_employed">Self Employed</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Tenancy Status & Notice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                Resident Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)] font-bold capitalize"
              >
                <option value="active">Active Resident</option>
                <option value="notice">Under Notice</option>
                <option value="pending">Waiting to Move</option>
                <option value="vacated">Vacated</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                Notice Period (Days)
              </label>
              <Input
                type="number"
                value={String(formData.noticePeriodDays)}
                onChange={(e) => handleChange('noticePeriodDays', e.target.value)}
              />
            </div>
          </div>

          {formData.status === 'notice' && (
            <div>
              <label className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400 block mb-1">
                Expected Vacate / Leave Date
              </label>
              <Input
                type="date"
                value={formData.expectedLeaveDate}
                onChange={(e) => handleChange('expectedLeaveDate', e.target.value)}
              />
            </div>
          )}

          {/* Financial: Rent & Deposit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                Monthly Rent (₹) *
              </label>
              <Input
                type="number"
                value={formData.monthlyRent}
                onChange={(e) => handleChange('monthlyRent', e.target.value)}
                className="font-mono font-bold text-emerald-600 dark:text-emerald-400"
                error={errors.monthlyRent}
              />
              {errors.monthlyRent && (
                <p className="text-xs text-rose-500 mt-1">{errors.monthlyRent}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                Security Deposit (₹)
              </label>
              <Input
                type="number"
                value={formData.securityDeposit}
                onChange={(e) => handleChange('securityDeposit', e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          {/* Meal Preference */}
          <div>
            <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
              Meal Preference
            </label>
            <select
              value={formData.foodPreference}
              onChange={(e) => handleChange('foodPreference', e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--card)] text-sm text-[var(--ink)]"
            >
              <option value="veg">Vegetarian</option>
              <option value="nonveg">Non-Vegetarian</option>
              <option value="eggetarian">Eggetarian</option>
              <option value="none">No Food / Self</option>
            </select>
          </div>

          {/* Emergency Contact */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--card-subtle)] p-3.5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] block">
              Emergency Contact
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                placeholder="Name"
                value={formData.emergencyName}
                onChange={(e) => handleChange('emergencyName', e.target.value)}
              />
              <Input
                placeholder="Relation"
                value={formData.emergencyRelation}
                onChange={(e) => handleChange('emergencyRelation', e.target.value)}
              />
              <Input
                type="tel"
                placeholder="Phone"
                value={formData.emergencyPhone}
                onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
              Internal Notes
            </label>
            <Input
              placeholder="Notes..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>

          <DialogFooter className="pt-4 border-t border-[var(--line)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
