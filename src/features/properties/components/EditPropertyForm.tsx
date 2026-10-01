'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Camera,
  Trash2,
  Save,
  Utensils,
  ArrowLeft,
} from 'lucide-react';
import { propertyApi } from '../api/property.api';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { toast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { Gender, ShareType } from '@/types/property';
import Image from 'next/image';

const SHARING_OPTIONS: Array<{
  id: ShareType;
  label: string;
  beds: number;
  icon: typeof User;
}> = [
  { id: 'single', label: 'Single Sharing', beds: 1, icon: User },
  { id: 'double', label: 'Double Sharing', beds: 2, icon: Users },
  { id: 'triple', label: 'Triple Sharing', beds: 3, icon: Users },
  { id: 'four', label: 'Four Sharing', beds: 4, icon: Users },
];

const GENDER_OPTIONS: Array<{ id: Gender; label: string }> = [
  { id: 'any', label: 'Co-living (Any)' },
  { id: 'male', label: 'Boys / Men' },
  { id: 'female', label: 'Girls / Women' },
];

const FOOD_OPTIONS = [
  { id: 'none', label: 'No Food' },
  { id: 'veg', label: 'Veg Only' },
  { id: 'nonveg', label: 'Non-Veg' },
  { id: 'both', label: 'Veg & Non-Veg' },
];

const COMMON_AMENITIES = [
  'WiFi',
  'Power Backup',
  'CCTV',
  'RO Water',
  'Daily Housekeeping',
  'Smart TV',
  'Geyser',
  'Refrigerator',
  'Washing Machine',
  'Parking',
  'Elevator / Lift',
  'Security Guard',
];

interface EditPropertyFormProps {
  propertyId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditPropertyForm({ propertyId, onSuccess, onCancel }: EditPropertyFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch Existing Property
  const { data: rawProperty, isLoading, error } = useQuery({
    queryKey: ['property-detail', propertyId],
    queryFn: () => propertyApi.getProperty(propertyId),
    enabled: !!propertyId,
  });

  const property = rawProperty as Record<string, any> | undefined;

  // Form State
  const [form, setForm] = useState({
    name: '',
    description: '',
    gender: 'any' as Gender,
    food: 'none',
    foodIncluded: false,
    address: '',
    area: '',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '',
    mapsLink: '',
    rent: '',
    deposit: '',
    noticePeriod: '30',
    contactPhone: '',
    contactWhatsapp: '',
    amenities: [] as string[],
    photos: [] as Array<{ url: string; publicId?: string; caption?: string }>,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  // Pre-fill form when data arrives
  useEffect(() => {
    if (property) {
      const pricing = property.pricing || {};
      const pgDetails = property.pgDetails || {};
      const roomConfig = pgDetails.roomConfigs?.[0] || property.roomConfigs?.[0] || {};

      const rentVal =
        pricing.expectedPrice ||
        roomConfig.rent ||
        roomConfig.monthlyRent ||
        property.rent?.single ||
        '';

      const depositVal =
        pricing.securityDeposit ||
        roomConfig.deposit ||
        property.securityDeposit ||
        '';

      const rawPhotos = property.photos || [];
      const normalizedPhotos = rawPhotos.map((p: any) => {
        if (typeof p === 'string') return { url: p, publicId: '' };
        return { url: p.url, publicId: p.publicId || '', caption: p.caption || '' };
      });

      setForm({
        name: property.name || property.title || '',
        description: property.description || '',
        gender: (pgDetails.gender || property.gender || 'any') as Gender,
        food: pgDetails.food || property.food || 'none',
        foodIncluded: Boolean(pgDetails.foodIncluded ?? property.foodIncluded ?? false),
        address: property.address || property.fullAddress || '',
        area: property.area || '',
        city: property.city || 'Pune',
        state: property.state || 'Maharashtra',
        postalCode: property.postalCode || '',
        mapsLink: property.mapsLink || '',
        rent: String(rentVal || ''),
        deposit: String(depositVal || ''),
        noticePeriod: String(property.noticePeriod || 30),
        contactPhone: property.contactPhone || '',
        contactWhatsapp: property.contactWhatsapp || property.contactPhone || '',
        amenities: property.amenities || property.facilities || [],
        photos: normalizedPhotos,
      });
    }
  }, [property]);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleAmenity = (item: string) => {
    setForm((prev) => {
      const exists = prev.amenities.includes(item);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== item)
          : [...prev.amenities, item],
      };
    });
  };

  // Add new photo
  const handleAddPhoto = (url: string, publicId?: string) => {
    setForm((prev) => ({
      ...prev,
      photos: [...prev.photos, { url, publicId: publicId || '' }],
    }));
  };

  // Delete photo
  const handleDeletePhoto = async (index: number, publicId?: string) => {
    if (publicId) {
      setDeletingPhotoId(publicId);
      try {
        await propertyApi.deletePropertyPhoto(propertyId, publicId);
        toast.success('Photo removed');
      } catch {
        // Silently continue local removal
      } finally {
        setDeletingPhotoId(null);
      }
    }
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 3) {
      errs.name = 'PG name must be at least 3 characters.';
    }
    if (!form.area.trim()) {
      errs.area = 'Area / locality is required.';
    }
    if (!form.city.trim()) {
      errs.city = 'City is required.';
    }
    if (!form.address.trim() || form.address.trim().length < 5) {
      errs.address = 'Full address is required.';
    }
    if (!form.contactPhone.trim() || !/^[6-9]\d{9}$/.test(form.contactPhone.trim().replace(/\D/g, ''))) {
      errs.contactPhone = 'Enter a valid 10-digit mobile number.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => propertyApi.updateProperty(propertyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-detail', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['owner-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      toast.success('Property updated successfully');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/properties/${propertyId}`);
      }
    },
    onError: (err: any) => {
      toast.error('Failed to update property', err?.message || 'Please check your inputs.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Incomplete form', 'Please check the required fields.');
      return;
    }

    const rentAmount = parseFloat(form.rent) || 5000;
    const depositAmount = form.deposit ? parseFloat(form.deposit) : rentAmount;
    const cleanPhone = form.contactPhone.replace(/\D/g, '');
    const cleanWhatsapp = (form.contactWhatsapp || form.contactPhone).replace(/\D/g, '');

    const payload: Record<string, any> = {
      name: form.name.trim(),
      title: form.name.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
      fullAddress: form.address.trim(),
      area: form.area.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      mapsLink: form.mapsLink.trim(),
      contactPhone: cleanPhone,
      contactWhatsapp: cleanWhatsapp,
      pricing: {
        expectedPrice: rentAmount,
        securityDeposit: depositAmount,
        maintenanceType: 'included',
      },
      pgDetails: {
        propertySubtype: 'PG',
        gender: form.gender,
        food: form.food,
        foodIncluded: form.foodIncluded,
        isAvailable: true,
      },
      amenities: form.amenities,
      facilities: form.amenities,
      photos: form.photos.map((p, idx) => ({
        url: p.url,
        publicId: p.publicId || '',
        caption: p.caption || '',
        isMain: idx === 0,
        order: idx,
      })),
      noticePeriod: parseInt(form.noticePeriod, 10) || 30,
    };

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Could not load property</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          The property ID could not be loaded or you do not have permission to edit it.
        </p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* ─── Card 1: Basic Information ─── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Property Details</h3>
            <p className="text-[11px] text-slate-400">Name, gender category, and food offerings</p>
          </div>
        </div>

        {/* PG Name */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
            PG / Hostel Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="e.g. Royal Comfort PG & Hostel"
            className={`w-full rounded-xl border bg-slate-900/90 py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 ${
              errors.name
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
                : 'border-slate-800 focus:border-emerald-500/60 focus:ring-emerald-500/20'
            }`}
          />
          {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
        </div>

        {/* Gender Selection */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Target Residents / Gender
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {GENDER_OPTIONS.map((g) => {
              const selected = form.gender === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => updateField('gender', g.id)}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                    selected
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  {selected && <Check className="h-3.5 w-3.5" />}
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Food Offerings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Food Service
            </label>
            <select
              value={form.food}
              onChange={(e) => updateField('food', e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {FOOD_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-3 mt-auto">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">Meals Included in Rent</span>
            </div>
            <input
              type="checkbox"
              checked={form.foodIncluded}
              onChange={(e) => updateField('foodIncluded', e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
            About PG / House Rules
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe amenities, proximity to IT parks, curfews, or special benefits..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* ─── Card 2: Location (No Google Map picker needed) ─── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Location & Address</h3>
            <p className="text-[11px] text-slate-400">Postal details and directions for tenants</p>
          </div>
        </div>

        {/* Full Address */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
            Complete Street Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Building name, flat/plot no, street, near landmark"
            className={`w-full rounded-xl border bg-slate-900/90 py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 ${
              errors.address
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
                : 'border-slate-800 focus:border-emerald-500/60 focus:ring-emerald-500/20'
            }`}
          />
          {errors.address && <p className="mt-1 text-xs text-rose-400">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Area / Locality <span className="text-rose-500">*</span>
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
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              City <span className="text-rose-500">*</span>
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
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
            Google Maps Link (optional)
          </label>
          <input
            type="url"
            value={form.mapsLink}
            onChange={(e) => updateField('mapsLink', e.target.value)}
            placeholder="https://maps.google.com/?q=..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* ─── Card 3: Contact Details ─── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Phone className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Owner / Manager Contacts</h3>
            <p className="text-[11px] text-slate-400">Numbers for tenant inquiries & notifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Contact Phone <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={form.contactPhone}
              onChange={(e) => updateField('contactPhone', e.target.value)}
              placeholder="10-digit mobile number"
              className={`w-full rounded-xl border bg-slate-900/90 py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 ${
                errors.contactPhone
                  ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
                  : 'border-slate-800 focus:border-emerald-500/60 focus:ring-emerald-500/20'
              }`}
            />
            {errors.contactPhone && (
              <p className="mt-1 text-xs text-rose-400">{errors.contactPhone}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              WhatsApp Number
            </label>
            <input
              type="tel"
              value={form.contactWhatsapp}
              onChange={(e) => updateField('contactWhatsapp', e.target.value)}
              placeholder="WhatsApp number for invoices"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* ─── Card 4: Amenities & Facilities ─── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Facilities & Amenities</h3>
            <p className="text-[11px] text-slate-400">Available utilities across this PG</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {COMMON_AMENITIES.map((amenity) => {
            const selected = form.amenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                  selected
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-md border flex items-center justify-center ${
                    selected ? 'bg-emerald-500 border-emerald-400' : 'border-slate-700'
                  }`}
                >
                  {selected && <Check className="h-3 w-3 text-slate-950 font-bold" />}
                </div>
                <span>{amenity}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Card 5: Property Photos ─── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Property Photos ({form.photos.length})</h3>
            <p className="text-[11px] text-slate-400">Upload photos of rooms, building, and facilities</p>
          </div>
        </div>

        {/* Photos Grid */}
        {form.photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {form.photos.map((photo, i) => (
              <div
                key={i}
                className="relative group rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950"
              >
                <Image
                  src={photo.url}
                  alt={`Photo ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 200px"
                />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(i, photo.publicId)}
                  disabled={deletingPhotoId === photo.publicId}
                  className="absolute top-1.5 right-1.5 rounded-lg bg-rose-600/90 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                >
                  {deletingPhotoId === photo.publicId ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <ImageUpload
          label="Add New Property Photo"
          onChange={handleAddPhoto}
          aspectRatio="video"
        />
      </div>

      {/* ─── Bottom Actions ─── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel ? onCancel : () => router.back()}
          disabled={updateMutation.isPending}
          className="rounded-xl border-slate-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={updateMutation.isPending}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 shadow-lg shadow-emerald-950/50"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Property Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
