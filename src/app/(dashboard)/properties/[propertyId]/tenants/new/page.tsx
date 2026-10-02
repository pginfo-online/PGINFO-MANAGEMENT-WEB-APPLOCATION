'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  UserPlus,
  Building,
  BedDouble,
  User,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  Shield,
  Utensils,
  Check,
  Search,
  Loader2,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { usePGRooms } from '@/features/rooms/hooks/useRooms';
import { useAddTenant, useSearchExistingUsers } from '@/features/tenants/hooks/useTenants';
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { useQuery } from '@tanstack/react-query';
import { formatINR } from '@/lib/utils';
import type { AddTenantPayload, SystemUserSummary, Profession, FoodPreference, RentCycle } from '@/types/tenant';
import type { Room, Bed } from '@/types/property';

const PROFESSION_OPTIONS: { id: Profession; label: string }[] = [
  { id: 'working_professional', label: 'Working Professional' },
  { id: 'student', label: 'Student' },
  { id: 'self_employed', label: 'Self Employed' },
  { id: 'other', label: 'Other' },
];

const FOOD_OPTIONS: { id: FoodPreference; label: string }[] = [
  { id: 'veg', label: 'Vegetarian' },
  { id: 'nonveg', label: 'Non-Vegetarian' },
  { id: 'eggetarian', label: 'Eggetarian' },
  { id: 'none', label: 'No Food / Self' },
];

const LOCK_IN_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 1, label: '1 Mo' },
  { value: 3, label: '3 Mos' },
  { value: 6, label: '6 Mos' },
];

export default function NewTenantOnboardingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const propertyId = params.propertyId as string;
  const initialRoomId = searchParams.get('roomId') || '';
  const initialBedId = searchParams.get('bedId') || '';

  // Property Details
  const { data: dashboardData } = useQuery({
    queryKey: ['property-dashboard', propertyId],
    queryFn: () => dashboardApi.getPropertyDashboard(propertyId),
    enabled: !!propertyId,
  });
  const propertyName = dashboardData?.data?.property?.name || 'Property';

  // Rooms Query
  const { data: roomsData, isLoading: isLoadingRooms } = usePGRooms(propertyId);
  const rooms: Room[] = useMemo(() => roomsData?.rooms || [], [roomsData]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'male' as 'male' | 'female' | 'other',
    profession: 'working_professional' as Profession,
    aadhaar: '',
    roomId: initialRoomId,
    bedId: initialBedId,
    monthlyRent: '',
    securityDeposit: '',
    joinDate: new Date().toISOString().split('T')[0],
    rentCycle: 'standard' as RentCycle,
    billingDate: '1',
    lockInPeriodMonths: 0,
    noticePeriodDays: 30,
    foodPreference: 'veg' as FoodPreference,
    emergencyName: '',
    emergencyRelation: 'Guardian',
    emergencyPhone: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userQuery, setUserQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Registered user search
  const { data: searchedUsers, isLoading: isSearchingUsers } = useSearchExistingUsers(userQuery);

  const addMutation = useAddTenant(propertyId);

  // Sync initial query params
  useEffect(() => {
    if (initialRoomId && !formData.roomId) {
      setFormData((prev) => ({ ...prev, roomId: initialRoomId }));
    }
    if (initialBedId && !formData.bedId) {
      setFormData((prev) => ({ ...prev, bedId: initialBedId }));
    }
  }, [initialRoomId, initialBedId, formData.roomId, formData.bedId]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r._id === formData.roomId),
    [rooms, formData.roomId]
  );

  const availableBeds: Bed[] = useMemo(() => {
    if (!selectedRoom) return [];
    return selectedRoom.beds || [];
  }, [selectedRoom]);

  // When room changes, auto-select bed and auto-fill rent
  useEffect(() => {
    if (!selectedRoom) return;
    const rent = Number(selectedRoom.rentPerBed || selectedRoom.rent || 0);
    setFormData((prev) => {
      let bedId = prev.bedId;
      const beds = selectedRoom.beds || [];
      const hasCurrent = beds.some((b) => b._id === bedId);
      if (!hasCurrent) {
        const firstVacant = beds.find((b) => b.status === 'vacant');
        bedId = firstVacant ? firstVacant._id : beds[0]?._id || '';
      }
      return {
        ...prev,
        bedId,
        monthlyRent: prev.monthlyRent || (rent > 0 ? String(rent) : ''),
        securityDeposit: prev.securityDeposit || (rent > 0 ? String(rent) : ''),
      };
    });
  }, [selectedRoom]);

  const handleChange = useCallback((field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSelectUser = (user: SystemUserSummary) => {
    setFormData((prev) => ({
      ...prev,
      name: user.name || prev.name,
      phone: user.phone || prev.phone,
      email: user.email || prev.email,
    }));
    setShowUserDropdown(false);
    setUserQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Full name is required (minimum 2 characters)';
    }

    const cleanPhone = formData.phone.trim().replace(/\D/g, '');
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Valid 10-digit Indian mobile number required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (formData.roomId && !formData.bedId) {
      newErrors.bedId = 'Please select a bed in the selected room';
    }

    if (!formData.joinDate) {
      newErrors.joinDate = 'Check-in date is required';
    }

    const rent = parseFloat(formData.monthlyRent);
    if (isNaN(rent) || rent <= 0) {
      newErrors.monthlyRent = 'Monthly rent must be greater than 0';
    }

    if (formData.emergencyPhone) {
      const cleanEmer = formData.emergencyPhone.trim().replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanEmer)) {
        newErrors.emergencyPhone = 'Enter a valid 10-digit emergency number';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const payload: AddTenantPayload = {
        name: formData.name.trim(),
        phone: cleanPhone,
        email: formData.email.trim() || undefined,
        gender: formData.gender,
        profession: formData.profession,
        aadhaar: formData.aadhaar.trim() || undefined,
        room: formData.roomId || undefined,
        roomId: formData.roomId || undefined,
        bed: formData.bedId || undefined,
        bedId: formData.bedId || undefined,
        joinDate: formData.joinDate,
        monthlyRent: rent,
        securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : 0,
        rentCycle: formData.rentCycle,
        billingDate: formData.rentCycle === 'custom' ? parseInt(formData.billingDate, 10) : 1,
        lockInPeriodMonths: formData.lockInPeriodMonths,
        noticePeriodDays: formData.noticePeriodDays || 30,
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

      await addMutation.mutateAsync(payload);
      toast.success(
        'Resident Onboarded',
        `${formData.name} has been enrolled into ${selectedRoom ? `Room ${selectedRoom.roomNumber}` : 'property'}.`
      );
      router.push(`/properties/${propertyId}/tenants`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to onboard resident';
      toast.error('Onboarding Failed', msg);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-24">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link
            href={`/properties/${propertyId}/tenants`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--card-subtle)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <Link href="/dashboard" className="hover:text-[var(--ink)] transition-colors flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <span>/</span>
            <Link href={`/properties/${propertyId}`} className="hover:text-[var(--ink)] transition-colors flex items-center gap-1">
              <Building className="h-3.5 w-3.5" />
              {propertyName}
            </Link>
            <span>/</span>
            <Link href={`/properties/${propertyId}/tenants`} className="hover:text-[var(--ink)] transition-colors">
              Tenants
            </Link>
            <span>/</span>
            <span className="font-bold text-[var(--ink)]">Onboard Resident</span>
          </div>
        </div>

        {/* Page Banner */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[var(--ink)] tracking-tight">
                Resident Onboarding Wizard
              </h1>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Register tenant personal details, assign available room & bed, and configure rent billing terms.
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ─── Section 1: Personal Details ─── */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h2 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-500" />
                1. Personal Information
              </h2>
              <span className="text-xs text-[var(--muted)]">* Required fields</span>
            </div>

            {/* Registered user lookup */}
            <div className="relative">
              <label className="text-xs font-semibold uppercase text-[var(--muted)] block mb-1">
                Lookup Registered App User (Optional)
              </label>
              <div className="relative">
                <Input
                  placeholder="Type to search existing users by phone or email..."
                  value={userQuery}
                  onChange={(e) => {
                    setUserQuery(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  icon={<Search className="h-4 w-4 text-[var(--muted)]" />}
                />
                {isSearchingUsers && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-emerald-500" />
                )}
              </div>

              {showUserDropdown && searchedUsers && searchedUsers.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--card)] shadow-xl p-1 divide-y divide-[var(--line)]">
                  {searchedUsers.map((u) => (
                    <button
                      key={u.userId}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className="w-full text-left p-2.5 hover:bg-[var(--card-subtle)] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-bold text-[var(--ink)]">{u.name}</p>
                        <p className="text-[11px] text-[var(--muted)] font-mono">
                          {u.phone} {u.email ? `• ${u.email}` : ''}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Auto-fill
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  icon={<User className="h-4 w-4 text-[var(--muted)]" />}
                  error={errors.name}
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit phone number"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  icon={<Phone className="h-4 w-4 text-[var(--muted)]" />}
                  className="font-mono"
                  error={errors.phone}
                />
                {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Email & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="priya@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  icon={<Mail className="h-4 w-4 text-[var(--muted)]" />}
                  error={errors.email}
                />
                {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['male', 'female', 'other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleChange('gender', g)}
                      className={`py-2 text-xs font-bold uppercase rounded-xl border transition-all cursor-pointer ${
                        formData.gender === g
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                          : 'border-[var(--line)] bg-[var(--card)] text-[var(--muted)]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Profession */}
            <div>
              <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1.5">
                Profession
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PROFESSION_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleChange('profession', item.id)}
                    className={`p-2.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      formData.profession === item.id
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                        : 'border-[var(--line)] bg-[var(--card)] text-[var(--muted)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aadhaar */}
            <div>
              <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                Aadhaar / Government ID (Optional)
              </label>
              <Input
                placeholder="12-digit Aadhaar"
                value={formData.aadhaar}
                onChange={(e) => handleChange('aadhaar', e.target.value)}
                className="font-mono max-w-sm"
              />
            </div>

            {/* Emergency Contact */}
            <div className="rounded-xl border border-[var(--line)] bg-[var(--card-subtle)] p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] block">
                Emergency Contact Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  placeholder="Guardian / Contact Name"
                  value={formData.emergencyName}
                  onChange={(e) => handleChange('emergencyName', e.target.value)}
                />
                <Input
                  placeholder="Relation (e.g. Parent)"
                  value={formData.emergencyRelation}
                  onChange={(e) => handleChange('emergencyRelation', e.target.value)}
                />
                <Input
                  type="tel"
                  placeholder="Emergency Phone"
                  value={formData.emergencyPhone}
                  onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                  className="font-mono"
                  error={errors.emergencyPhone}
                />
              </div>
              {errors.emergencyPhone && (
                <p className="text-xs text-rose-500">{errors.emergencyPhone}</p>
              )}
            </div>
          </div>

          {/* ─── Section 2: Room & Bed Assignment ─── */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h2 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-emerald-500" />
                2. Room & Bed Assignment
              </h2>
              {formData.roomId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleChange('roomId', '');
                    handleChange('bedId', '');
                  }}
                  className="text-xs text-[var(--muted)]"
                >
                  Unassign Room
                </Button>
              )}
            </div>

            {isLoadingRooms ? (
              <div className="p-8 text-center text-xs text-[var(--muted)]">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
                <span>Loading available rooms...</span>
              </div>
            ) : rooms.length === 0 ? (
              <p className="text-xs text-[var(--muted)] italic">
                No rooms configured. You can onboard this resident without bed allocation.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {rooms.map((room) => {
                    const isSelected = formData.roomId === room._id;
                    const beds = room.beds || [];
                    const vacantCount = beds.filter((b) => b.status === 'vacant').length;
                    const totalBeds = beds.length || 1;
                    const isFull = vacantCount === 0;

                    return (
                      <button
                        key={room._id}
                        type="button"
                        disabled={isFull}
                        onClick={() => {
                          handleChange('roomId', room._id);
                          handleChange('bedId', '');
                        }}
                        className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isFull
                            ? 'opacity-40 border-[var(--line)] bg-[var(--card-subtle)] cursor-not-allowed'
                            : isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                            : 'border-[var(--line)] bg-[var(--card)] hover:border-emerald-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[var(--ink)]">
                            Room {room.roomNumber}
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[11px] text-[var(--muted)] capitalize mt-0.5">
                          {room.shareType} sharing
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {vacantCount} vacant
                          </span>
                          <span className="font-mono text-[var(--muted)]">
                            {formatINR(room.rentPerBed || room.rent || 0)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bed Selection */}
                {selectedRoom && (
                  <div className="pt-4 border-t border-[var(--line)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                        Available Beds in Room {selectedRoom.roomNumber} *
                      </span>
                      {errors.bedId && (
                        <span className="text-xs text-rose-500">{errors.bedId}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {availableBeds.map((bed) => {
                        const isOccupied = bed.status === 'occupied';
                        const isSelected = formData.bedId === bed._id;

                        return (
                          <button
                            key={bed._id}
                            type="button"
                            disabled={isOccupied}
                            onClick={() => handleChange('bedId', bed._id)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                              isOccupied
                                ? 'opacity-40 border-[var(--line)] bg-[var(--card-subtle)] cursor-not-allowed'
                                : isSelected
                                ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm'
                                : 'border-[var(--line)] bg-[var(--card)] hover:border-emerald-500/40'
                            }`}
                          >
                            <BedDouble
                              className={`h-4 w-4 mx-auto ${
                                isSelected ? 'text-white' : 'text-emerald-500'
                              }`}
                            />
                            <p
                              className={`text-xs font-bold mt-1 ${
                                isSelected ? 'text-white' : 'text-[var(--ink)]'
                              }`}
                            >
                              Bed {bed.bedLabel}
                            </p>
                            <span
                              className={`text-[10px] ${
                                isOccupied
                                  ? 'text-rose-500'
                                  : isSelected
                                  ? 'text-emerald-100'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {isOccupied ? 'Occupied' : 'Vacant'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Section 3: Financial & Tenancy Terms ─── */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h2 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-emerald-500" />
                3. Financial & Tenancy Terms
              </h2>
            </div>

            {/* Rent & Security Deposit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                  Monthly Rent (₹) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 8000"
                  value={formData.monthlyRent}
                  onChange={(e) => handleChange('monthlyRent', e.target.value)}
                  icon={<IndianRupee className="h-4 w-4 text-[var(--muted)]" />}
                  className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm"
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
                  placeholder="e.g. 10000"
                  value={formData.securityDeposit}
                  onChange={(e) => handleChange('securityDeposit', e.target.value)}
                  icon={<Shield className="h-4 w-4 text-[var(--muted)]" />}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Move-in Date & Notice Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                  Move-in / Joining Date <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => handleChange('joinDate', e.target.value)}
                  icon={<Calendar className="h-4 w-4 text-[var(--muted)]" />}
                  error={errors.joinDate}
                />
                {errors.joinDate && (
                  <p className="text-xs text-rose-500 mt-1">{errors.joinDate}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                  Notice Period (Days)
                </label>
                <Input
                  type="number"
                  value={String(formData.noticePeriodDays)}
                  onChange={(e) =>
                    handleChange('noticePeriodDays', parseInt(e.target.value, 10) || 0)
                  }
                  className="font-mono"
                />
              </div>
            </div>

            {/* Rent Cycle */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-[var(--ink)] block">
                Billing Cycle
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('rentCycle', 'standard')}
                  className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    formData.rentCycle === 'standard'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-[var(--line)] bg-[var(--card)] text-[var(--muted)]'
                  }`}
                >
                  <p className="text-xs font-bold text-[var(--ink)]">Standard (1st of month)</p>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5">
                    Billed on the 1st of every month
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleChange('rentCycle', 'custom')}
                  className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    formData.rentCycle === 'custom'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-[var(--line)] bg-[var(--card)] text-[var(--muted)]'
                  }`}
                >
                  <p className="text-xs font-bold text-[var(--ink)]">Custom Day</p>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5">
                    Billed on custom day of month
                  </p>
                </button>
              </div>

              {formData.rentCycle === 'custom' && (
                <div className="pt-2 max-w-xs">
                  <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                    Billing Day (1 - 28) *
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={formData.billingDate}
                    onChange={(e) => handleChange('billingDate', e.target.value)}
                    className="font-mono"
                  />
                </div>
              )}
            </div>

            {/* Lock-in Period */}
            <div>
              <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1.5">
                Lock-in Period
              </label>
              <div className="grid grid-cols-4 gap-2">
                {LOCK_IN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange('lockInPeriodMonths', opt.value)}
                    className={`p-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      formData.lockInPeriodMonths === opt.value
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                        : 'border-[var(--line)] bg-[var(--card)] text-[var(--muted)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Preference */}
            <div>
              <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1.5">
                Food Preference
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FOOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChange('foodPreference', opt.id)}
                    className={`p-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      formData.foodPreference === opt.id
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                        : 'border-[var(--line)] bg-[var(--card)] text-[var(--muted)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                Internal Notes
              </label>
              <Input
                placeholder="Any special remarks..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/properties/${propertyId}/tenants`)}
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={addMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
            >
              Register Resident
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
