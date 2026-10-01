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
import { ImageUpload } from '@/components/ui/image-upload';
import { Loader2 } from 'lucide-react';
import type { Room, FloorLabel, ShareType, CreatePGRoomPayload } from '@/types/property';

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
  'AC',
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
  depositAmount: string;
  roomSize: string;
  acIncluded: boolean;
  attachedBathroom: boolean;
  hasMeter: boolean;
  amenities: string[];
  image: string | null;
  imagePublicId: string | null;
  notes: string;
}

interface FormErrors {
  roomNumber?: string;
  rent?: string;
  totalBeds?: string;
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface AddEditRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreatePGRoomPayload) => Promise<void> | void;
  isPending: boolean;
  editingRoom?: Room | null;
}

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
    depositAmount: '',
    roomSize: '',
    acIncluded: false,
    attachedBathroom: true,
    hasMeter: false,
    amenities: ['Attached Washroom', 'Wi-Fi'],
    image: null,
    imagePublicId: null,
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Populate form when editing or opening
  useEffect(() => {
    if (editingRoom) {
      setForm({
        roomNumber: editingRoom.roomNumber || '',
        floorLabel: (editingRoom.floorLabel as FloorLabel) || 'ground',
        shareType: (editingRoom.shareType as ShareType) || 'double',
        totalBeds: editingRoom.totalBeds || editingRoom.beds?.length || 2,
        rent: String(editingRoom.rentPerBed || editingRoom.rent || ''),
        depositAmount: editingRoom.depositAmount ? String(editingRoom.depositAmount) : '',
        roomSize: editingRoom.roomSize || '',
        acIncluded: Boolean(editingRoom.acIncluded ?? editingRoom.ac),
        attachedBathroom: Boolean(
          editingRoom.attachedBathroom ?? editingRoom.bathroomType === 'attached'
        ),
        hasMeter: Boolean(editingRoom.hasMeter),
        amenities: editingRoom.amenities || ['Attached Washroom', 'Wi-Fi'],
        image: editingRoom.image || null,
        imagePublicId: editingRoom.imagePublicId || null,
        notes: editingRoom.notes || '',
      });
    } else {
      setForm({
        roomNumber: '',
        floorLabel: 'ground',
        shareType: 'double',
        totalBeds: 2,
        rent: '',
        depositAmount: '',
        roomSize: '',
        acIncluded: false,
        attachedBathroom: true,
        hasMeter: false,
        amenities: ['Attached Washroom', 'Wi-Fi'],
        image: null,
        imagePublicId: null,
        notes: '',
      });
    }
    setErrors({});
  }, [editingRoom, open]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
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
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errs: FormErrors = {};

      if (!form.roomNumber.trim()) {
        errs.roomNumber = 'Room number is required';
      }

      const rentNum = parseFloat(form.rent);
      if (!form.rent || isNaN(rentNum) || rentNum <= 0) {
        errs.rent = 'Valid monthly rent amount is required';
      }

      if (form.totalBeds < 1 || form.totalBeds > 12) {
        errs.totalBeds = 'Bed capacity must be between 1 and 12';
      }

      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }

      const rentVal = parseFloat(form.rent) || 0;
      const depositVal = form.depositAmount ? parseFloat(form.depositAmount) : rentVal;

      const payload: CreatePGRoomPayload = {
        roomNumber: form.roomNumber.trim(),
        floorLabel: form.floorLabel,
        shareType: form.shareType,
        totalBeds: form.totalBeds,
        rentPerBed: rentVal,
        rent: rentVal,
        monthlyRent: rentVal,
        depositAmount: depositVal,
        deposit: depositVal,
        roomSize: form.roomSize.trim() || undefined,
        ac: form.acIncluded,
        acIncluded: form.acIncluded,
        attachedBathroom: form.attachedBathroom,
        bathroomType: form.attachedBathroom ? 'attached' : 'common',
        hasMeter: form.hasMeter,
        amenities: form.amenities,
        image: form.image || undefined,
        imagePublicId: form.imagePublicId || undefined,
        notes: form.notes.trim() || undefined,
      };

      await onSubmit(payload);
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
    <Dialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[var(--text-main)] dark:text-white tracking-tight">
            {isEditing ? `Edit Room ${editingRoom?.roomNumber}` : 'Add New Room'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-3 space-y-4">
          {/* Row 1: Room Number & Floor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1.5 block">
                Room Number <span className="text-rose-500">*</span>
              </label>
              <Input
                id="room-number-input"
                placeholder="e.g. 101, A-12"
                value={form.roomNumber}
                onChange={(e) => setField('roomNumber', e.target.value)}
                className={errors.roomNumber ? 'border-rose-500/60 focus:border-rose-500' : ''}
              />
              {errors.roomNumber && (
                <p className="mt-1 text-[11px] text-rose-500 dark:text-rose-400">{errors.roomNumber}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1.5 block">
                Floor
              </label>
              <select
                value={form.floorLabel}
                onChange={(e) => setField('floorLabel', e.target.value as FloorLabel)}
                className="flex h-10 w-full rounded-xl border border-[var(--border-main)] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-[var(--text-main)] dark:text-slate-100 focus:outline-none focus:border-[var(--gold)] dark:focus:border-emerald-500"
              >
                {FLOOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Sharing Type & Total Beds */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1.5 block">
                Sharing Category
              </label>
              <select
                value={form.shareType}
                onChange={(e) => setField('shareType', e.target.value as ShareType)}
                className="flex h-10 w-full rounded-xl border border-[var(--border-main)] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-[var(--text-main)] dark:text-slate-100 focus:outline-none focus:border-[var(--gold)] dark:focus:border-emerald-500"
              >
                {SHARE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1.5 block">
                Total Beds <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min={1}
                max={12}
                value={form.totalBeds}
                onChange={(e) => setField('totalBeds', parseInt(e.target.value, 10) || 1)}
                className={errors.totalBeds ? 'border-rose-500/60' : ''}
              />
              {errors.totalBeds && (
                <p className="mt-1 text-[11px] text-rose-500 dark:text-rose-400">{errors.totalBeds}</p>
              )}
            </div>
          </div>

          {/* Row 3: Rent per Bed & Security Deposit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1.5 block">
                Monthly Rent / Bed (₹) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 7500"
                value={form.rent}
                onChange={(e) => setField('rent', e.target.value)}
                className={errors.rent ? 'border-rose-500/60 focus:border-rose-500' : ''}
              />
              {errors.rent && <p className="mt-1 text-[11px] text-rose-500 dark:text-rose-400">{errors.rent}</p>}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1.5 block">
                Security Deposit (₹)
              </label>
              <Input
                type="number"
                min={0}
                placeholder="Defaults to 1 mo rent"
                value={form.depositAmount}
                onChange={(e) => setField('depositAmount', e.target.value)}
              />
            </div>
          </div>

          {/* Room Size & Facilities Quick Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1.5 block">
                Room Size (optional)
              </label>
              <Input
                placeholder="e.g. 180 sq ft"
                value={form.roomSize}
                onChange={(e) => setField('roomSize', e.target.value)}
              />
            </div>

            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 rounded-xl border border-[var(--border-main)] dark:border-slate-800 bg-[var(--bg-card-subtle)] dark:bg-slate-900/60 p-2.5 cursor-pointer hover:border-[var(--border-strong)] transition-colors">
                <input
                  type="checkbox"
                  checked={form.attachedBathroom}
                  onChange={(e) => setField('attachedBathroom', e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                />
                <span className="text-xs font-semibold text-[var(--text-main)] dark:text-slate-200">Attached Washroom</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 rounded-xl border border-[var(--border-main)] dark:border-slate-800 bg-[var(--bg-card-subtle)] dark:bg-slate-900/60 p-2.5 cursor-pointer hover:border-[var(--border-strong)] transition-colors">
              <input
                type="checkbox"
                checked={form.acIncluded}
                onChange={(e) => setField('acIncluded', e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
              />
              <span className="text-xs font-semibold text-[var(--text-main)] dark:text-slate-200">AC Installed</span>
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-[var(--border-main)] dark:border-slate-800 bg-[var(--bg-card-subtle)] dark:bg-slate-900/60 p-2.5 cursor-pointer hover:border-[var(--border-strong)] transition-colors">
              <input
                type="checkbox"
                checked={form.hasMeter}
                onChange={(e) => setField('hasMeter', e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
              />
              <span className="text-xs font-semibold text-[var(--text-main)] dark:text-slate-200">Sub-Meter (Electricity)</span>
            </label>
          </div>

          {/* Room Photo Upload */}
          <div className="pt-2">
            <ImageUpload
              label="Room Photo"
              value={form.image}
              onChange={(url, publicId) => {
                setField('image', url);
                setField('imagePublicId', publicId || null);
              }}
              onRemove={() => {
                setField('image', null);
                setField('imagePublicId', null);
              }}
              aspectRatio="wide"
            />
          </div>

          {/* Amenities Chips */}
          <div className="pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-2 block">
              Room Amenities
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AMENITY_OPTIONS.map((amenity) => {
                const checked = form.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all ${
                      checked
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-900 border-[var(--border-main)] dark:border-slate-700 text-[var(--text-muted)] dark:text-slate-400 hover:border-[var(--border-strong)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)] dark:text-slate-400 mb-1.5 block">
              Special Instructions / Notes
            </label>
            <Input
              placeholder="e.g. Corner room with large window, recently painted"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
            />
          </div>

          <DialogFooter className="mt-6 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="rounded-xl border-[var(--border-main)] dark:border-slate-700 text-[var(--text-main)] dark:text-slate-300 text-xs shadow-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              id="save-room-btn"
              disabled={isPending}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              {isEditing ? 'Update Room' : 'Create Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
