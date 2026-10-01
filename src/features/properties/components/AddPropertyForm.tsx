'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  MapPin,
  BedDouble,
  User,
  Users,
  Phone,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Wifi,
  Zap,
  Camera,
  Droplets,
  Tv,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth/store';
import { propertyApi } from '../api/property.api';
import { GoogleAddressAutocomplete } from '@/components/maps/GoogleAddressAutocomplete';
import { toast } from '@/components/ui/toast';
import {
  cleanPhoneNumber,
  sanitizeMapsUrl,
  isValidMapsUrl,
  type ParsedAddress,
} from '@/lib/maps/google-maps';
import { Button } from '@/components/ui/button';
import type { ShareType, Gender, CreatePropertyPayload } from '@/types/property';

const SHARING_OPTIONS: Array<{
  id: ShareType;
  label: string;
  beds: number;
  icon: typeof User;
  description: string;
}> = [
  { id: 'single', label: 'Single', beds: 1, icon: User, description: '1 Bed / Private Room' },
  { id: 'double', label: 'Double', beds: 2, icon: Users, description: '2 Beds / Twin Sharing' },
  { id: 'triple', label: 'Triple', beds: 3, icon: Users, description: '3 Beds Sharing' },
  { id: 'four', label: 'Four Sharing', beds: 4, icon: Users, description: '4 Beds Sharing' },
];

const GENDER_OPTIONS: Array<{ id: Gender; label: string }> = [
  { id: 'any', label: 'Co-living (Any)' },
  { id: 'male', label: 'Boys / Men' },
  { id: 'female', label: 'Girls / Women' },
];

const COMMON_AMENITIES = [
  { id: 'WiFi', label: 'High-speed Wi-Fi', icon: Wifi },
  { id: 'Power Backup', label: 'Power Backup', icon: Zap },
  { id: 'CCTV', label: 'CCTV Security', icon: Camera },
  { id: 'RO Water', label: 'RO Purified Water', icon: Droplets },
  { id: 'Daily Housekeeping', label: 'Daily Housekeeping', icon: Sparkles },
  { id: 'Smart TV', label: 'Smart TV / Lounge', icon: Tv },
];

interface AddPropertyFormProps {
  onSuccess?: (propertyId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export function AddPropertyForm({
  onSuccess,
  onCancel,
  className = '',
}: AddPropertyFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const userPhone = user?.phone ? cleanPhoneNumber(user.phone) : '';

  // Form State
  const [form, setForm] = useState({
    name: '',
    subtype: 'PG',
    gender: 'any' as Gender,
    address: '',
    area: '',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '',
    mapsLink: '',
    googlePlaceId: '',
    latitude: 18.5913 as number | null,
    longitude: 73.7389 as number | null,
    shareType: 'single' as ShareType,
    rent: '',
    deposit: '',
    contactPhone: userPhone,
    contactWhatsapp: userPhone,
    selectedAmenities: ['WiFi', 'Power Backup', 'CCTV', 'RO Water'] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const updateField = (
    field: string,
    value: string | number | null | boolean | ShareType | Gender | string[]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setSubmitError(null);
  };

  const handleSelectAddress = (data: ParsedAddress) => {
    setForm((prev) => ({
      ...prev,
      address: data.address || prev.address,
      area: data.area || prev.area,
      city: data.city || prev.city || 'Pune',
      state: data.state || prev.state || 'Maharashtra',
      postalCode: data.postalCode || prev.postalCode,
      mapsLink: data.mapsLink || prev.mapsLink,
      googlePlaceId: data.placeId || prev.googlePlaceId,
      latitude: data.latitude ?? prev.latitude,
      longitude: data.longitude ?? prev.longitude,
    }));

    setErrors((prev) => {
      const next = { ...prev };
      delete next.address;
      if (data.area) delete next.area;
      if (data.city) delete next.city;
      return next;
    });
  };

  const toggleAmenity = (amenityId: string) => {
    setForm((prev) => {
      const exists = prev.selectedAmenities.includes(amenityId);
      const updated = exists
        ? prev.selectedAmenities.filter((a) => a !== amenityId)
        : [...prev.selectedAmenities, amenityId];
      return { ...prev, selectedAmenities: updated };
    });
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    // 1. PG Name (min 3 chars)
    if (!form.name || form.name.trim().length < 3) {
      errs.name = 'PG name must be at least 3 characters.';
    }

    // 2. Address / Search
    if (!form.address || form.address.trim().length < 5) {
      if (!form.area || form.area.trim().length < 2) {
        errs.address = 'Complete street address is required.';
      }
    }

    // 3. Area / Locality
    if (!form.area || form.area.trim().length < 2) {
      errs.area = 'Area / locality is required (e.g. Hinjewadi Phase 1).';
    }

    // 4. City
    if (!form.city || form.city.trim().length < 2) {
      errs.city = 'City is required (e.g. Pune, Bangalore).';
    }

    // 5. Monthly Rent (positive number)
    const rentNum = Number(form.rent);
    if (!form.rent || isNaN(rentNum) || rentNum <= 0) {
      errs.rent = 'Please enter a valid monthly rent amount (₹).';
    }

    // 6. Contact Phone (10-digit Indian mobile)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanedPhone = cleanPhoneNumber(form.contactPhone);
    if (!cleanedPhone || !phoneRegex.test(cleanedPhone)) {
      errs.contactPhone = 'Enter a valid 10-digit Indian mobile number.';
    }

    // 7. Google Maps Link (optional but if provided must be valid)
    if (form.mapsLink && form.mapsLink.trim().length > 0) {
      if (!isValidMapsUrl(form.mapsLink)) {
        errs.mapsLink = 'Enter a valid Google Maps URL.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitError('Please review and complete the highlighted required fields.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const selectedSharing =
        SHARING_OPTIONS.find((s) => s.id === form.shareType) || SHARING_OPTIONS[0];
      const bedsCount = selectedSharing.beds;
      const rentAmount = Number(form.rent);
      const depositAmount = form.deposit ? Number(form.deposit) : rentAmount;
      const contactPhone = cleanPhoneNumber(form.contactPhone);
      const contactWhatsapp = form.contactWhatsapp
        ? cleanPhoneNumber(form.contactWhatsapp)
        : contactPhone;

      let finalAddress = form.address?.trim() || '';
      if (finalAddress.length < 5) {
        finalAddress = `${form.area.trim()}, ${form.city.trim()}, India`;
      }

      const payload: CreatePropertyPayload = {
        title: form.name.trim(),
        name: form.name.trim(),
        category: 'pg',
        purpose: 'rent',
        listedBy: 'owner',
        city: form.city.trim(),
        area: form.area.trim(),
        address: finalAddress,
        fullAddress: finalAddress,
        mapsLink:
          form.mapsLink && form.mapsLink.trim().length > 0
            ? sanitizeMapsUrl(form.mapsLink)
            : undefined,
        googlePlaceId: form.googlePlaceId || undefined,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        contactPhone,
        contactWhatsapp,
        pricing: {
          expectedPrice: rentAmount,
          securityDeposit: depositAmount,
          maintenanceType: 'included',
        },
        pgDetails: {
          propertySubtype: 'PG',
          gender: form.gender,
          food: 'none',
          foodIncluded: false,
          ac: false,
          isAvailable: true,
          roomConfigs: [
            {
              shareType: form.shareType,
              rent: rentAmount,
              monthlyRent: rentAmount,
              totalBeds: bedsCount,
              availableBeds: bedsCount,
              bathroomType: 'attached',
              furnitureIncluded: true,
              acIncluded: false,
            },
          ],
        },
        amenities: form.selectedAmenities,
      };

      const res = await propertyApi.createProperty(payload);

      // Invalidate queries to refresh dashboard and properties list
      await queryClient.invalidateQueries({ queryKey: ['owner-dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['my-properties'] });

      const responseData = res?.data as Record<string, unknown> | undefined;
      const rawProperty = responseData?.property || responseData?.pg;
      const propertyObj =
        typeof rawProperty === 'object' && rawProperty !== null
          ? (rawProperty as Record<string, unknown>)
          : {};
      const newPropertyId = String(propertyObj._id || propertyObj.id || '');

      toast.success('Property Created Successfully', 'Redirecting to your new property dashboard...');
      setSuccessMessage('🎉 Property Created Successfully! Redirecting...');

      setTimeout(() => {
        if (onSuccess && newPropertyId) {
          onSuccess(newPropertyId);
        } else if (newPropertyId) {
          router.push(`/properties/${newPropertyId}`);
        } else {
          router.push('/dashboard');
        }
      }, 1000);
    } catch (err: unknown) {
      console.error('Create Property Error:', err);
      let msg = 'Failed to create property. Please verify the details and try again.';
      if (err instanceof Error) {
        msg = err.message;
      }
      toast.error('Creation Failed', msg);
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* ─── Top Info Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-900/60 p-4.5 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">Quick Property Onboarding</h4>
            <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">
              Fill the essentials to list your PG instantly with precise Google Maps coordinates.
              You can configure detailed room inventories, photos, staff, and policies anytime after listing.
            </p>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <Check className="h-4 w-4 flex-shrink-0 text-emerald-400 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ─── Card 1: Basic Information ─── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Basic Information</h3>
            <p className="text-[11px] text-slate-400">PG property identity & tenant preference</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* PG Name */}
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              PG Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. Starlight Luxury Living PG"
              maxLength={80}
              className={`w-full rounded-xl border bg-slate-900/90 py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
                  : 'border-slate-800 focus:border-emerald-500/60 focus:ring-emerald-500/20'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
          </div>

          {/* Gender Preference */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Tenant Preference *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateField('gender', opt.id)}
                  className={`flex items-center justify-center rounded-xl border py-2 px-2 text-xs font-medium transition-all ${
                    form.gender === opt.id
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-semibold shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subtype */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Property Subtype *
            </label>
            <select
              value={form.subtype}
              onChange={(e) => updateField('subtype', e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 px-3 text-sm text-slate-100 transition-all focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="PG">Standard PG</option>
              <option value="Co-living">Premium Co-living</option>
              <option value="Hostel">Student Hostel</option>
              <option value="Student Accommodation">Student Accommodation</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Card 2: Location & Google Maps Integration ─── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Location & Google Maps</h3>
              <p className="text-[11px] text-slate-400">Search address & pinpoint exact building on the map</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-3 w-3" />
            Google Maps API
          </span>
        </div>

        {/* Google Address Search Autocomplete */}
        <GoogleAddressAutocomplete
          value={form.address}
          onSelectAddress={handleSelectAddress}
          error={errors.address}
        />

        {/* Area and City Inputs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Area / Locality *
            </label>
            <input
              type="text"
              value={form.area}
              onChange={(e) => updateField('area', e.target.value)}
              placeholder="e.g. Hinjewadi Phase 1, Wakad"
              className={`w-full rounded-xl border bg-slate-900/90 py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 ${
                errors.area
                  ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
                  : 'border-slate-800 focus:border-emerald-500/60 focus:ring-emerald-500/20'
              }`}
            />
            {errors.area && <p className="mt-1 text-xs text-rose-400">{errors.area}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              City *
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="e.g. Pune, Bangalore, Mumbai"
              className={`w-full rounded-xl border bg-slate-900/90 py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 ${
                errors.city
                  ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
                  : 'border-slate-800 focus:border-emerald-500/60 focus:ring-emerald-500/20'
              }`}
            />
            {errors.city && <p className="mt-1 text-xs text-rose-400">{errors.city}</p>}
          </div>
        </div>

        {/* Google Maps link (optional) */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            Google Maps Link (optional)
          </label>
          <input
            type="url"
            value={form.mapsLink}
            onChange={(e) => updateField('mapsLink', e.target.value)}
            placeholder="https://maps.google.com/..."
            className={`w-full rounded-xl border bg-slate-900/90 py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 ${
              errors.mapsLink
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
                : 'border-slate-800 focus:border-emerald-500/60 focus:ring-emerald-500/20'
            }`}
          />
          {errors.mapsLink && <p className="mt-1 text-xs text-rose-400">{errors.mapsLink}</p>}
        </div>
      </div>

      {/* ─── Card 3: Room Type & Pricing ─── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BedDouble className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Room Type & Pricing</h3>
            <p className="text-[11px] text-slate-400">Configure base sharing occupancy & monthly rental rates</p>
          </div>
        </div>

        {/* Sharing Type Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Base Sharing Type *
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SHARING_OPTIONS.map((opt) => {
              const isSelected = form.shareType === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateField('shareType', opt.id)}
                  className={`group relative flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition-all ${
                    isSelected
                      ? 'border-emerald-500/80 bg-emerald-500/15 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`mt-2 text-xs font-bold ${
                      isSelected ? 'text-emerald-300' : 'text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-slate-400">{opt.description}</span>
                  {isSelected && (
                    <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Monthly Rent & Security Deposit */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Monthly Rent per Bed (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                value={form.rent}
                onChange={(e) => updateField('rent', e.target.value)}
                placeholder="e.g. 8500"
                min={0}
                className={`w-full rounded-xl border bg-slate-900/90 py-2.5 pl-8 pr-3.5 text-sm font-semibold text-slate-100 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 ${
                  errors.rent
                    ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-emerald-500/60 focus:ring-emerald-500/20'
                }`}
              />
            </div>
            {errors.rent && <p className="mt-1 text-xs text-rose-400">{errors.rent}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Security Deposit (₹) <span className="text-slate-500 font-normal">(Defaults to 1 mo rent)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                value={form.deposit}
                onChange={(e) => updateField('deposit', e.target.value)}
                placeholder={form.rent ? `e.g. ${form.rent}` : 'e.g. 8500'}
                min={0}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-8 pr-3.5 text-sm font-semibold text-slate-100 placeholder:text-slate-500 transition-all focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>

        {/* Common Amenities Badges */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Included Amenities & Facilities
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_AMENITIES.map((amenity) => {
              const isChecked = form.selectedAmenities.includes(amenity.id);
              const Icon = amenity.icon;
              return (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => toggleAmenity(amenity.id)}
                  className={`flex items-center gap-1.5 rounded-lg border py-1.5 px-3 text-xs font-medium transition-all ${
                    isChecked
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isChecked ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{amenity.label}</span>
                  {isChecked && <Check className="h-3 w-3 text-emerald-400 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Card 4: Contact Information ─── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Phone className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Contact Information</h3>
            <p className="text-[11px] text-slate-400">Owner phone number for tenant calls and automated SMS/WhatsApp alerts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Contact Phone (10-digit mobile) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-semibold text-slate-400">
                +91
              </span>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) =>
                  updateField('contactPhone', e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                placeholder="9876543210"
                maxLength={10}
                className={`w-full rounded-xl border bg-slate-900/90 py-2.5 pl-11 pr-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 ${
                  errors.contactPhone
                    ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
                    : 'border-slate-800 focus:border-emerald-500/60 focus:ring-emerald-500/20'
                }`}
              />
            </div>
            {errors.contactPhone && (
              <p className="mt-1 text-xs text-rose-400">{errors.contactPhone}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              WhatsApp Number <span className="text-slate-500 font-normal">(Defaults to phone)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-semibold text-slate-400">
                +91
              </span>
              <input
                type="tel"
                value={form.contactWhatsapp}
                onChange={(e) =>
                  updateField('contactWhatsapp', e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                placeholder={form.contactPhone || '9876543210'}
                maxLength={10}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-11 pr-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Actions Bar ─── */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold px-8 shadow-lg shadow-emerald-950/40"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Creating PG Listing...</span>
            </>
          ) : (
            <>
              <Building2 className="mr-2 h-4 w-4" />
              <span>Create PG Listing</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
