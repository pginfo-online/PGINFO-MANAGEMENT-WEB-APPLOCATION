'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  User,
  Phone,
  Mail,
  Search,
  Check,
  BedDouble,
  Calendar,
  IndianRupee,
  Shield,
  Utensils,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { usePGRooms } from '@/features/rooms/hooks/useRooms';
import { useSearchExistingUsers } from '../hooks/useTenants';
import { formatINR } from '@/lib/utils';
import type { AddTenantPayload, SystemUserSummary, Profession, FoodPreference, RentCycle } from '@/types/tenant';
import type { Room, Bed } from '@/types/property';

const STEPS = ['Personal Details', 'Room & Bed', 'Financial Terms'];

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
  { value: 0, label: 'No Lock-in' },
  { value: 1, label: '1 Month' },
  { value: 3, label: '3 Months' },
  { value: 6, label: '6 Months' },
];

interface TenantWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  initialRoomId?: string;
  initialBedId?: string;
  onSubmit: (payload: AddTenantPayload) => Promise<void> | void;
  isPending?: boolean;
}

export function TenantWizardModal({
  open,
  onOpenChange,
  propertyId,
  initialRoomId,
  initialBedId,
  onSubmit,
  isPending = false,
}: TenantWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'male' as 'male' | 'female' | 'other',
    profession: 'working_professional' as Profession,
    aadhaar: '',
    emergencyContactName: '',
    emergencyContactRelation: 'Guardian',
    emergencyContactPhone: '',
    roomId: initialRoomId || '',
    bedId: initialBedId || '',
    monthlyRent: '',
    securityDeposit: '',
    joinDate: new Date().toISOString().split('T')[0],
    rentCycle: 'standard' as RentCycle,
    billingDate: '1',
    lockInPeriodMonths: 0,
    noticePeriodDays: 30,
    foodPreference: 'veg' as FoodPreference,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Load Rooms
  const { data: roomsData, isLoading: isLoadingRooms } = usePGRooms(propertyId);
  const rooms: Room[] = useMemo(() => roomsData?.rooms || [], [roomsData]);

  // Search existing users
  const { data: searchedUsers, isLoading: isSearchingUsers } = useSearchExistingUsers(userSearchQuery);

  // Reset or initialize on open
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setFormData({
        name: '',
        phone: '',
        email: '',
        gender: 'male',
        profession: 'working_professional',
        aadhaar: '',
        emergencyContactName: '',
        emergencyContactRelation: 'Guardian',
        emergencyContactPhone: '',
        roomId: initialRoomId || '',
        bedId: initialBedId || '',
        monthlyRent: '',
        securityDeposit: '',
        joinDate: new Date().toISOString().split('T')[0],
        rentCycle: 'standard',
        billingDate: '1',
        lockInPeriodMonths: 0,
        noticePeriodDays: 30,
        foodPreference: 'veg',
        notes: '',
      });
      setErrors({});
      setUserSearchQuery('');
    }
  }, [open, initialRoomId, initialBedId]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r._id === formData.roomId),
    [rooms, formData.roomId]
  );

  const availableBeds: Bed[] = useMemo(() => {
    if (!selectedRoom) return [];
    return selectedRoom.beds || [];
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
    setUserSearchQuery('');
  };

  const handleSelectRoom = (room: Room) => {
    const rent = Number(room.rentPerBed || room.rent || 0);
    handleChange('roomId', room._id);
    handleChange('bedId', '');
    if (rent > 0 && !formData.monthlyRent) {
      handleChange('monthlyRent', String(rent));
    }
  };

  const handleSelectBed = (bed: Bed) => {
    if (bed.status === 'occupied') return;
    handleChange('bedId', bed._id);
  };

  // Step 1 validation
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Full name is required (minimum 2 characters)';
    }
    const cleanPhone = formData.phone.trim().replace(/\D/g, '');
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid email address';
    }
    if (formData.emergencyContactPhone) {
      const cleanEmerPhone = formData.emergencyContactPhone.trim().replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanEmerPhone)) {
        errs.emergencyContactPhone = 'Enter a valid 10-digit emergency number';
      }
    }
    return errs;
  };

  // Step 2 validation
  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    // If room is selected, bed selection is required
    if (formData.roomId && !formData.bedId) {
      errs.bedId = 'Please select an available bed in the chosen room, or clear room selection';
    }
    return errs;
  };

  // Step 3 validation
  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    const rent = parseFloat(formData.monthlyRent);
    if (isNaN(rent) || rent <= 0) {
      errs.monthlyRent = 'Monthly rent must be greater than 0';
    }
    if (formData.securityDeposit) {
      const dep = parseFloat(formData.securityDeposit);
      if (isNaN(dep) || dep < 0) {
        errs.securityDeposit = 'Enter a valid security deposit amount';
      }
    }
    if (!formData.joinDate) {
      errs.joinDate = 'Joining date is required';
    }
    if (formData.rentCycle === 'custom') {
      const bDay = parseInt(formData.billingDate, 10);
      if (isNaN(bDay) || bDay < 1 || bDay > 28) {
        errs.billingDate = 'Custom billing day must be between 1 and 28';
      }
    }
    return errs;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setErrors({});
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const errs = validateStep2();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setErrors({});
      setCurrentStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 3) return;

    const errs = validateStep3();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload: AddTenantPayload = {
      name: formData.name.trim(),
      phone: formData.phone.trim().replace(/\D/g, ''),
      email: formData.email.trim() || undefined,
      gender: formData.gender,
      profession: formData.profession,
      aadhaar: formData.aadhaar.trim() || undefined,
      room: formData.roomId || undefined,
      roomId: formData.roomId || undefined,
      bed: formData.bedId || undefined,
      bedId: formData.bedId || undefined,
      monthlyRent: parseFloat(formData.monthlyRent),
      securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : 0,
      joinDate: formData.joinDate,
      rentCycle: formData.rentCycle,
      billingDate: formData.rentCycle === 'custom' ? parseInt(formData.billingDate, 10) : 1,
      lockInPeriodMonths: formData.lockInPeriodMonths,
      noticePeriodDays: formData.noticePeriodDays || 30,
      foodPreference: formData.foodPreference,
      notes: formData.notes.trim() || undefined,
      emergencyContact: (formData.emergencyContactName || formData.emergencyContactPhone)
        ? {
            name: formData.emergencyContactName.trim(),
            relationship: formData.emergencyContactRelation,
            phone: formData.emergencyContactPhone.trim().replace(/\D/g, ''),
          }
        : undefined,
    };

    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="border-b border-[var(--line)] p-5 pb-4 bg-[var(--card-subtle)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-[var(--ink)]">
              Onboard New Resident
            </DialogTitle>
          </DialogHeader>

          {/* Wizard Progress Stepper */}
          <div className="mt-4 flex items-center justify-between">
            {STEPS.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = currentStep === stepNum;
              const isCompleted = currentStep > stepNum;

              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isActive
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20'
                        : 'bg-[var(--line)] text-[var(--muted)]'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                  </div>
                  <span
                    className={`text-xs font-semibold truncate ${
                      isActive
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                        : isCompleted
                        ? 'text-[var(--ink)]'
                        : 'text-[var(--muted)]'
                    }`}
                  >
                    {label}
                  </span>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 rounded-full ${
                        isCompleted ? 'bg-emerald-600' : 'bg-[var(--line)]'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ════════════════════ STEP 1: PERSONAL DETAILS ════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Registered user lookup */}
              <div className="relative">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider block mb-1">
                  Lookup Registered App User (Optional)
                </label>
                <div className="relative">
                  <Input
                    placeholder="Search by phone, name or email..."
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
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
                          Select
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
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    icon={<User className="h-4 w-4 text-[var(--muted)]" />}
                    error={errors.name}
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit number"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    icon={<Phone className="h-4 w-4 text-[var(--muted)]" />}
                    className="font-mono"
                    error={errors.phone}
                  />
                  {errors.phone && (
                    <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Email & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                    Email Address (Optional)
                  </label>
                  <Input
                    type="email"
                    placeholder="rahul@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    icon={<Mail className="h-4 w-4 text-[var(--muted)]" />}
                    error={errors.email}
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500 mt-1">{errors.email}</p>
                  )}
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
                        className={`py-2 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                          formData.gender === g
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                            : 'border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)]'
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
                          : 'border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)]'
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
                  placeholder="e.g. 12-digit Aadhaar number"
                  value={formData.aadhaar}
                  onChange={(e) => handleChange('aadhaar', e.target.value)}
                  className="font-mono"
                />
              </div>

              {/* Emergency Contact */}
              <div className="rounded-xl border border-[var(--line)] bg-[var(--card-subtle)] p-3.5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] block">
                  Emergency Contact (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    placeholder="Contact Name"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                  />
                  <Input
                    placeholder="Relationship (e.g. Father)"
                    value={formData.emergencyContactRelation}
                    onChange={(e) => handleChange('emergencyContactRelation', e.target.value)}
                  />
                  <Input
                    type="tel"
                    placeholder="Emergency Phone"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                    className="font-mono"
                    error={errors.emergencyContactPhone}
                  />
                </div>
                {errors.emergencyContactPhone && (
                  <p className="text-xs text-rose-500">{errors.emergencyContactPhone}</p>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════ STEP 2: ROOM & BED ════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[var(--ink)]">Select Room</h4>
                  <p className="text-xs text-[var(--muted)]">
                    Pick a room to view available beds, or leave unallocated.
                  </p>
                </div>
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
                    Clear Selection
                  </Button>
                )}
              </div>

              {isLoadingRooms ? (
                <div className="flex items-center justify-center p-8 text-[var(--muted)]">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading available rooms...</span>
                </div>
              ) : rooms.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--line)] p-6 text-center text-xs text-[var(--muted)]">
                  No rooms created for this property yet. You can complete onboarding without bed assignment.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto p-1">
                  {rooms.map((room) => {
                    const isSelected = formData.roomId === room._id;
                    const beds = room.beds || [];
                    const occupiedCount = beds.filter(
                      (b) => b.status === 'occupied'
                    ).length;
                    const totalBeds = beds.length || 1;
                    const isFull = occupiedCount >= totalBeds && totalBeds > 0;

                    return (
                      <button
                        key={room._id}
                        type="button"
                        disabled={isFull}
                        onClick={() => handleSelectRoom(room)}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          isFull
                            ? 'opacity-40 border-[var(--line)] bg-[var(--card)] cursor-not-allowed'
                            : isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20 shadow-sm'
                            : 'border-[var(--line)] bg-[var(--card)] hover:border-emerald-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[var(--ink)]">
                            Room {room.roomNumber}
                          </span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-emerald-500" />
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--muted)] capitalize mt-0.5">
                          {room.shareType} sharing
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isFull
                                ? 'bg-rose-500/10 text-rose-500'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {occupiedCount}/{totalBeds} Beds
                          </span>
                          <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatINR(room.rentPerBed || room.rent || 0)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Beds Grid for selected room */}
              {selectedRoom && (
                <div className="mt-4 pt-4 border-t border-[var(--line)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                      Available Beds in Room {selectedRoom.roomNumber} *
                    </h4>
                    {errors.bedId && (
                      <span className="text-xs text-rose-500">{errors.bedId}</span>
                    )}
                  </div>

                  {availableBeds.length === 0 ? (
                    <p className="text-xs text-[var(--muted)]">
                      No beds configured in this room.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {availableBeds.map((bed) => {
                        const isOccupied = bed.status === 'occupied';
                        const isSelected = formData.bedId === bed._id;

                        return (
                          <button
                            key={bed._id}
                            type="button"
                            disabled={isOccupied}
                            onClick={() => handleSelectBed(bed)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                              isOccupied
                                ? 'opacity-40 border-[var(--line)] bg-[var(--card)] cursor-not-allowed'
                                : isSelected
                                ? 'border-emerald-500 bg-emerald-600 text-white shadow-md'
                                : 'border-[var(--line)] bg-[var(--card)] hover:border-emerald-500/40'
                            }`}
                          >
                            <BedDouble
                              className={`h-5 w-5 mx-auto ${
                                isSelected ? 'text-white' : 'text-emerald-500'
                              }`}
                            />
                            <p
                              className={`text-xs font-bold mt-1.5 ${
                                isSelected ? 'text-white' : 'text-[var(--ink)]'
                              }`}
                            >
                              Bed {bed.bedLabel}
                            </p>
                            <span
                              className={`text-[10px] mt-0.5 inline-block ${
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
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════ STEP 3: FINANCIAL TERMS ════════════════════ */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {/* Rent & Deposit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                    Monthly Rent (₹) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 8500"
                    value={formData.monthlyRent}
                    onChange={(e) => handleChange('monthlyRent', e.target.value)}
                    icon={<IndianRupee className="h-4 w-4 text-[var(--muted)]" />}
                    className="font-mono text-emerald-600 dark:text-emerald-400 font-bold"
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
                    className="font-mono"
                    error={errors.securityDeposit}
                  />
                  {errors.securityDeposit && (
                    <p className="text-xs text-rose-500 mt-1">{errors.securityDeposit}</p>
                  )}
                </div>
              </div>

              {/* Move-in Date & Notice Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                    Joining Date <span className="text-rose-500">*</span>
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
              <div>
                <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1.5">
                  Rent Billing Cycle
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
                      Billed on 1st of every calendar month
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
                    <p className="text-xs font-bold text-[var(--ink)]">Custom Date</p>
                    <p className="text-[11px] text-[var(--muted)] mt-0.5">
                      Choose specific billing day of the month
                    </p>
                  </button>
                </div>
              </div>

              {formData.rentCycle === 'custom' && (
                <div>
                  <label className="text-xs font-semibold uppercase text-[var(--ink)] block mb-1">
                    Billing Day (1 - 28) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={formData.billingDate}
                    onChange={(e) => handleChange('billingDate', e.target.value)}
                    error={errors.billingDate}
                    className="font-mono max-w-xs"
                  />
                  {errors.billingDate && (
                    <p className="text-xs text-rose-500 mt-1">{errors.billingDate}</p>
                  )}
                </div>
              )}

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
                      className={`p-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
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
                  Meal Preference
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FOOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleChange('foodPreference', opt.id)}
                      className={`p-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
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
                  Additional Notes (Optional)
                </label>
                <Input
                  placeholder="Any special agreement terms or notes..."
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[var(--line)] p-4 px-6 bg-[var(--card-subtle)] flex items-center justify-between">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={isPending}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}

          {currentStep < 3 ? (
            <Button type="button" onClick={handleNext}>
              Next Step
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              isLoading={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Complete Onboarding
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
