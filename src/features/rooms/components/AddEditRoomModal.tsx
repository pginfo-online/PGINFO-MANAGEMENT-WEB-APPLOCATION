'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Room, FloorLabel, ShareType } from '@/types/property';
import type { CreatePGRoomPayload } from '@/types/property';

// ─── Amenity Options ────────────────────────────────────────────────────────

const AMENITY_OPTIONS = [
  'Attached Washroom',
  'Common Bathroom',
  'Wi-Fi',
  'Balcony',
  'Geyser',
  'Cupboard',
  'Fan',
  'TV',
  'Wardrobe',
  'Study Table',
  'Refrigerator',
  'Washing Machine',
  'Locker',
];

const FLOOR_OPTIONS: { value: FloorLabel; label: string }[] = [
  { value: 'ground', label: 'Ground Floor' },
  { value: 'first', label: '1st Floor' },
  { value: 'second', label: '2nd Floor' },
  { value: 'third', label: '3rd Floor' },
  { value: 'fourth', label: '4th Floor' },
  { value: 'fifth', label: '5th Floor' },
  { value: 'sixth', label: '6th Floor' },
  { value: 'seventh', label: '7th Floor' },
  { value: 'eighth', label: '8th Floor' },
  { value: 'terrace', label: 'Terrace' },
  { value: 'basement', label: 'Basement' },
];

const SHARE_TYPE_OPTIONS: { value: ShareType; label: string; beds: number }[] = [
  { value: 'single', label: 'Single Sharing', beds: 1 },
  { value: 'double', label: 'Double Sharing', beds: 2 },
  { value: 'triple', label: 'Triple Sharing', beds: 3 },
  { value: 'four', label: 'Four Sharing', beds: 4 },
  { value: 'dormitory', label: 'Dormitory (5+)', beds: 6 },
];

// ─── Form State ─────────────────────────────────────────────────────────────

interface FormState {
  roomNumber: string;
  floorLabel: FloorLabel;
  shareType: ShareType;
  totalBeds: number;
  rent: string;
  acIncluded: boolean;
  attachedBathroom: boolean;
  hasMeter: boolean;
  amenities: string[];
}

interface FormErrors {
  roomNumber?: string;
  rent?: string;
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface AddEditRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreatePGRoomPayload) => void;
  isPending: boolean;
  editingRoom?: Room | null;
}

// ─── Select Field Component ─────────────────────────────────────────────────

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Toggle Chip ─────────────────────────────────────────────────────────────

function ToggleChip({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
        checked
          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function AddEditRoomModal({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  editingRoom,
}: AddEditRoomModalProps) {
  const isEditing = !!editingRoom;

  const [form, setForm] = useState<FormState>({
    roomNumber: '',
    floorLabel: 'ground',
    shareType: 'double',
    totalBeds: 2,
    rent: '',
    acIncluded: false,
    attachedBathroom: true,
    hasMeter: false,
    amenities: ['Attached Washroom', 'Wi-Fi'],
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Populate form when editing
  useEffect(() => {
    if (editingRoom) {
      setForm({
        roomNumber: editingRoom.roomNumber || '',
        floorLabel: (editingRoom.floorLabel as FloorLabel) || 'ground',
        shareType: (editingRoom.shareType as ShareType) || 'double',
        totalBeds: editingRoom.totalBeds || editingRoom.beds?.length || 2,
        rent: String(editingRoom.rentPerBed || editingRoom.rent || ''),
        acIncluded: Boolean(editingRoom.acIncluded ?? editingRoom.ac),
        attachedBathroom: Boolean(editingRoom.attachedBathroom ?? editingRoom.bathroomType === 'attached'),
        hasMeter: Boolean(editingRoom.hasMeter),
        amenities: editingRoom.amenities || [],
      });
    } else {
      setForm({
        roomNumber: '',
        floorLabel: 'ground',
        shareType: 'double',
        totalBeds: 2,
        rent: '',
        acIncluded: false,
        attachedBathroom: true,
        hasMeter: false,
        amenities: ['Attached Washroom', 'Wi-Fi'],
      });
    }
    setErrors({});
  }, [editingRoom, open]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-sync totalBeds when shareType changes
      if (key === 'shareType') {
        const opt = SHARE_TYPE_OPTIONS.find((o) => o.value === value);
        if (opt) next.totalBeds = opt.beds;
      }
      return next;
    });
    if (key in errors) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof FormErrors];
        return next;
      });
    }
  }, [errors]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const errs: FormErrors = {};
      if (!form.roomNumber.trim()) errs.roomNumber = 'Room number is required';
      if (!form.rent || parseFloat(form.rent) <= 0)
        errs.rent = 'Valid rent amount is required';
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      const rentVal = parseFloat(form.rent) || 0;
      const payload: CreatePGRoomPayload = {
        roomNumber: form.roomNumber.trim(),
        floorLabel: form.floorLabel,
        shareType: form.shareType,
        totalBeds: form.totalBeds,
        rentPerBed: rentVal,
        rent: rentVal,
        monthlyRent: rentVal,
        ac: form.acIncluded,
        acIncluded: form.acIncluded,
        attachedBathroom: form.attachedBathroom,
        bathroomType: form.attachedBathroom ? 'attached' : 'common',
        hasMeter: form.hasMeter,
        amenities: form.amenities,
      };

      onSubmit(payload);
    },
    [form, onSubmit]
  );

  const toggleAmenity = useCallback((amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">
            {isEditing ? `Edit Room ${editingRoom?.roomNumber}` : 'Add New Room'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {/* Row 1: Room Number + Floor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Room Number <span className="text-rose-400">*</span>
              </label>
              <Input
                id="room-number-input"
                placeholder="e.g. 101, A-12"
                value={form.roomNumber}
                onChange={(e) => setField('roomNumber', e.target.value)}
                className={errors.roomNumber ? 'border-rose-500/50 focus:border-rose-500' : ''}
              />
              {errors.roomNumber && (
                <p className="mt-1 text-[11px] text-rose-400">{errors.roomNumber}</p>
              )}
            </div>

            <SelectField
              label="Floor"
              value={form.floorLabel}
              onChange={(v) => setField('floorLabel', v as FloorLabel)}
              options={FLOOR_OPTIONS}
            />
          </div>

          {/* Row 2: Sharing Type */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Sharing Type
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {SHARE_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setField('shareType', opt.value)}
                  className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                    form.shareType === opt.value
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <span className="block text-sm font-black">{opt.beds}</span>
                  <span className="block capitalize">{opt.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Rent */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Rent per Bed (₹) <span className="text-rose-400">*</span>
            </label>
            <Input
              id="room-rent-input"
              type="number"
              placeholder="e.g. 8500"
              value={form.rent}
              onChange={(e) => setField('rent', e.target.value)}
              className={`font-mono ${errors.rent ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
            />
            {errors.rent && (
              <p className="mt-1 text-[11px] text-rose-400">{errors.rent}</p>
            )}
          </div>

          {/* Row 4: Feature Toggles */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
              Room Features
            </label>
            <div className="flex flex-wrap gap-2">
              <ToggleChip
                label="AC Included"
                checked={form.acIncluded}
                onChange={(v) => setField('acIncluded', v)}
              />
              <ToggleChip
                label="Attached Bathroom"
                checked={form.attachedBathroom}
                onChange={(v) => setField('attachedBathroom', v)}
              />
              <ToggleChip
                label="Individual Meter"
                checked={form.hasMeter}
                onChange={(v) => setField('hasMeter', v)}
              />
            </div>
          </div>

          {/* Row 5: Amenities */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
              Amenities
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AMENITY_OPTIONS.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    form.amenities.includes(amenity)
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" id="save-room-btn" isLoading={isPending}>
              {isEditing ? 'Update Room' : 'Create Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
