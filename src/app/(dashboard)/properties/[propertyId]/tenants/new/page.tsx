'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  CheckCircle2,
  Home,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { useToast } from '@/components/ui/toast';
import { usePGRooms } from '@/features/rooms/hooks/useRooms';
import { tenantApi, type AddTenantPayload } from '@/features/tenants/api/tenant.api';
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatINR } from '@/lib/utils';
import type { Room, Bed } from '@/types/property';

export default function NewTenantOnboardingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const propertyId = params.propertyId as string;
  const initialRoomId = searchParams.get('roomId') || '';
  const initialBedId = searchParams.get('bedId') || '';

  // Queries
  const { data: dashboardData } = useQuery({
    queryKey: ['property-dashboard', propertyId],
    queryFn: () => dashboardApi.getPropertyDashboard(propertyId),
    enabled: !!propertyId,
  });
  const property = dashboardData?.data?.property;

  const { data: roomsData, isLoading: isLoadingRooms } = usePGRooms(propertyId);
  const rooms: Room[] = useMemo(() => roomsData?.rooms || [], [roomsData]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'male' as 'male' | 'female' | 'other',
    dateOfBirth: '',
    profession: 'working_professional',
    aadhaar: '',
    roomId: initialRoomId,
    bedId: initialBedId,
    joinDate: new Date().toISOString().split('T')[0],
    monthlyRent: '',
    securityDeposit: '',
    depositStatus: 'received',
    lockInPeriodMonths: '0',
    noticePeriodDays: '30',
    foodPreference: 'veg',
    emergencyName: '',
    emergencyRelation: 'Guardian',
    emergencyPhone: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update room/bed selection when initial query params or rooms load
  useEffect(() => {
    if (initialRoomId && !formData.roomId) {
      setFormData((prev) => ({ ...prev, roomId: initialRoomId }));
    }
    if (initialBedId && !formData.bedId) {
      setFormData((prev) => ({ ...prev, bedId: initialBedId }));
    }
  }, [initialRoomId, initialBedId, formData.roomId, formData.bedId]);

  // Auto-fill rent when room/bed is chosen
  const selectedRoom = useMemo(
    () => rooms.find((r) => r._id === formData.roomId),
    [rooms, formData.roomId]
  );

  const availableBeds: Bed[] = useMemo(() => {
    if (!selectedRoom) return [];
    return selectedRoom.beds || [];
  }, [selectedRoom]);

  // When room changes, pick the first vacant bed if current bed is invalid
  useEffect(() => {
    if (!selectedRoom) return;
    const rent = Number(selectedRoom.rentPerBed || selectedRoom.rent || 0);
    setFormData((prev) => {
      let bedId = prev.bedId;
      const beds = selectedRoom.beds || [];
      const hasCurrentBed = beds.some((b) => b._id === bedId);
      if (!hasCurrentBed) {
        const firstVacant = beds.find(
          (b) => b.status === 'vacant' || !(b as unknown as { isOccupied?: boolean }).isOccupied
        );
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

  const handleChange = (field: string, value: string) => {
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
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    const cleanPhone = formData.phone.trim().replace(/\D/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Enter a valid 10-digit mobile number';
    }

    if (!formData.roomId) newErrors.roomId = 'Please select a room';
    if (!formData.bedId) newErrors.bedId = 'Please select a bed';
    if (!formData.joinDate) newErrors.joinDate = 'Check-in date is required';
    if (!formData.monthlyRent || Number(formData.monthlyRent) < 0) {
      newErrors.monthlyRent = 'Monthly rent must be 0 or more';
    }

    if (formData.emergencyPhone && !/^[6-9]\d{9}$/.test(formData.emergencyPhone.trim().replace(/\D/g, ''))) {
      newErrors.emergencyPhone = 'Enter a valid 10-digit emergency number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: AddTenantPayload = {
        name: formData.name.trim(),
        phone: cleanPhone,
        email: formData.email.trim() || undefined,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || undefined,
        profession: formData.profession,
        aadhaar: formData.aadhaar.trim() || undefined,
        room: formData.roomId,
        bed: formData.bedId,
        joinDate: formData.joinDate,
        monthlyRent: Number(formData.monthlyRent),
        securityDeposit: formData.securityDeposit ? Number(formData.securityDeposit) : 0,
        depositStatus: formData.depositStatus,
        lockInPeriodMonths: Number(formData.lockInPeriodMonths) || 0,
        noticePeriodDays: Number(formData.noticePeriodDays) || 30,
        foodPreference: formData.foodPreference,
        notes: formData.notes.trim() || undefined,
        emergencyContact: formData.emergencyName
          ? {
              name: formData.emergencyName.trim(),
              relationship: formData.emergencyRelation,
              phone: formData.emergencyPhone.trim().replace(/\D/g, ''),
            }
          : undefined,
      };

      await tenantApi.addTenant(propertyId, payload);

      toast.success(
        'Resident Onboarded',
        `${formData.name} has been assigned to Room ${selectedRoom?.roomNumber || ''}.`
      );

      // Invalidate relevant queries so UI reflects immediately without manual refresh
      queryClient.invalidateQueries({ queryKey: ['pg-tenants', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['mgmt-rooms', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
      if (formData.roomId) {
        queryClient.invalidateQueries({ queryKey: ['room-detail', formData.roomId] });
      }

      router.push(`/properties/${propertyId}/tenants`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to onboard resident';
      toast.error('Onboarding Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link
            href={`/properties/${propertyId}/rooms`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
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
              {property?.name || 'Property'}
            </Link>
            <span>/</span>
            <Link href={`/properties/${propertyId}/tenants`} className="hover:text-[var(--ink)] transition-colors">
              Tenants
            </Link>
            <span>/</span>
            <span className="font-semibold text-[var(--ink)]">Add Resident</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[var(--gold)]">
              <UserPlus className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight">
                Resident Onboarding
              </h1>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                Assign room, bed inventory, and collect initial resident details for {property?.name || 'Property'}.
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal Details */}
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--line)]">
              <User className="h-5 w-5 text-[var(--gold)]" />
              <h2 className="text-base font-bold text-[var(--ink)]">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name" required error={errors.name}>
                <Input
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="rounded-xl border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
                />
              </FormField>

              <FormField label="Mobile Number" required error={errors.phone}>
                <Input
                  placeholder="10-digit number (e.g. 9876543210)"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="rounded-xl border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
                />
              </FormField>

              <FormField label="Email Address (Optional)">
                <Input
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="rounded-xl border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
                />
              </FormField>

              <FormField label="Gender">
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </FormField>

              <FormField label="Profession">
                <select
                  value={formData.profession}
                  onChange={(e) => handleChange('profession', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                >
                  <option value="working_professional">Working Professional</option>
                  <option value="student">Student</option>
                  <option value="self_employed">Self Employed</option>
                  <option value="other">Other</option>
                </select>
              </FormField>

              <FormField label="Aadhaar / National ID (Optional)">
                <Input
                  placeholder="12-digit Aadhaar number"
                  maxLength={14}
                  value={formData.aadhaar}
                  onChange={(e) => handleChange('aadhaar', e.target.value)}
                  className="rounded-xl border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
                />
              </FormField>
            </div>
          </div>

          {/* Section 2: Room & Bed Allocation */}
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--line)]">
              <BedDouble className="h-5 w-5 text-[var(--gold)]" />
              <h2 className="text-base font-bold text-[var(--ink)]">Room & Bed Allocation</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Assign Room" required error={errors.roomId}>
                <select
                  value={formData.roomId}
                  onChange={(e) => handleChange('roomId', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                >
                  <option value="">-- Choose a Room --</option>
                  {rooms.map((r) => {
                    const occupied = r.occupiedBeds ?? 0;
                    const total = r.totalBeds || r.beds?.length || 1;
                    const vacant = Math.max(0, total - occupied);
                    return (
                      <option key={r._id} value={r._id}>
                        Room {r.roomNumber} ({r.shareType} sharing) • {vacant} bed(s) open • Floor {r.floorLabel || 'Ground'}
                      </option>
                    );
                  })}
                </select>
              </FormField>

              <FormField label="Assign Bed" required error={errors.bedId}>
                <select
                  value={formData.bedId}
                  onChange={(e) => handleChange('bedId', e.target.value)}
                  disabled={!formData.roomId}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] disabled:opacity-50"
                >
                  <option value="">-- Choose a Bed --</option>
                  {availableBeds.map((b) => {
                    const isOccupied =
                      b.status === 'occupied' || (b as unknown as { isOccupied?: boolean }).isOccupied;
                    return (
                      <option key={b._id} value={b._id}>
                        {b.bedLabel} {isOccupied ? '(Occupied)' : '(Vacant)'}
                      </option>
                    );
                  })}
                </select>
              </FormField>

              <FormField label="Monthly Rent (₹)" required error={errors.monthlyRent}>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]" />
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 7500"
                    value={formData.monthlyRent}
                    onChange={(e) => handleChange('monthlyRent', e.target.value)}
                    className="pl-9 rounded-xl border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
                  />
                </div>
              </FormField>

              <FormField label="Security Deposit (₹)">
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]" />
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 7500"
                    value={formData.securityDeposit}
                    onChange={(e) => handleChange('securityDeposit', e.target.value)}
                    className="pl-9 rounded-xl border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
                  />
                </div>
              </FormField>

              <FormField label="Deposit Payment Status">
                <select
                  value={formData.depositStatus}
                  onChange={(e) => handleChange('depositStatus', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                >
                  <option value="received">Received in Full</option>
                  <option value="partial">Partial Payment</option>
                  <option value="pending">Pending</option>
                </select>
              </FormField>

              <FormField label="Check-in Date" required error={errors.joinDate}>
                <Input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => handleChange('joinDate', e.target.value)}
                  className="rounded-xl border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
                />
              </FormField>
            </div>
          </div>

          {/* Section 3: Preferences & Terms */}
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--line)]">
              <Utensils className="h-5 w-5 text-[var(--gold)]" />
              <h2 className="text-base font-bold text-[var(--ink)]">Preferences & Terms</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Food Preference">
                <select
                  value={formData.foodPreference}
                  onChange={(e) => handleChange('foodPreference', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                >
                  <option value="veg">Vegetarian</option>
                  <option value="nonveg">Non-Vegetarian</option>
                  <option value="eggetarian">Eggetarian</option>
                  <option value="none">No Meal Required</option>
                </select>
              </FormField>

              <FormField label="Notice Period (Days)">
                <Input
                  type="number"
                  min="0"
                  placeholder="30"
                  value={formData.noticePeriodDays}
                  onChange={(e) => handleChange('noticePeriodDays', e.target.value)}
                  className="rounded-xl border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
                />
              </FormField>

              <FormField label="Lock-in Period (Months)">
                <Input
                  type="number"
                  min="0"
                  max="24"
                  placeholder="0"
                  value={formData.lockInPeriodMonths}
                  onChange={(e) => handleChange('lockInPeriodMonths', e.target.value)}
                  className="rounded-xl border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
                />
              </FormField>
            </div>
          </div>

          {/* Section 4: Emergency Contact & Notes */}
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--line)]">
              <Shield className="h-5 w-5 text-[var(--gold)]" />
              <h2 className="text-base font-bold text-[var(--ink)]">Emergency Contact & Notes</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Contact Person Name">
                <Input
                  placeholder="e.g. Ramesh Sharma"
                  value={formData.emergencyName}
                  onChange={(e) => handleChange('emergencyName', e.target.value)}
                  className="rounded-xl border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
                />
              </FormField>

              <FormField label="Relationship">
                <select
                  value={formData.emergencyRelation}
                  onChange={(e) => handleChange('emergencyRelation', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                >
                  <option value="Parent">Parent</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                </select>
              </FormField>

              <FormField label="Emergency Phone" error={errors.emergencyPhone}>
                <Input
                  placeholder="10-digit number"
                  maxLength={10}
                  value={formData.emergencyPhone}
                  onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                  className="rounded-xl border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
                />
              </FormField>
            </div>

            <FormField label="Special Notes / Instructions">
              <textarea
                rows={3}
                placeholder="Add any specific requirements, key deposit notes, or agreement details..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full p-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] resize-none"
              />
            </FormField>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href={`/properties/${propertyId}/rooms`}>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)]"
              >
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={isSubmitting || isLoadingRooms}
              className="rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-strong)] text-white px-8 h-11 font-bold shadow-lg shadow-amber-500/10 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning Resident...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Complete Onboarding
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
