'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Search,
  Phone,
  UserX,
  Eye,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  tenantApi,
  type AddTenantPayload,
  type VacateTenantPayload,
} from '@/features/tenants/api/tenant.api';
import { propertyApi } from '@/features/properties/api/property.api';
import { formatINR, formatDate, formatPhone } from '@/lib/utils';
import type { Tenant } from '@/types/tenant';
import type { Room, Bed } from '@/types/property';

export default function TenantsManagementPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [vacatingTenant, setVacatingTenant] = useState<Tenant | null>(null);
  const [refundDeposit, setRefundDeposit] = useState(true);

  // Form State for Onboarding Tenant
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [foodPreference, setFoodPreference] = useState('veg');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Fetch Tenants
  const { data: tenantsData, isLoading } = useQuery({
    queryKey: ['pg-tenants', propertyId, statusFilter, search],
    queryFn: () =>
      tenantApi.getTenants(propertyId, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
      }),
    enabled: !!propertyId,
  });

  // Fetch Rooms for Bed Allocation
  const { data: roomsData } = useQuery({
    queryKey: ['pg-rooms', propertyId],
    queryFn: () => propertyApi.getPGRooms(propertyId),
    enabled: !!propertyId && isOnboardOpen,
  });

  const tenants: Tenant[] = tenantsData?.data || [];
  const rawRooms = roomsData?.data;
  const rooms: Room[] = Array.isArray(rawRooms)
    ? rawRooms
    : Array.isArray((rawRooms as { rooms?: Room[] })?.rooms)
    ? (rawRooms as { rooms: Room[] }).rooms
    : [];

  // Selected room's available beds
  const activeRoom = rooms.find((r) => r._id === selectedRoomId);
  const availableBeds = activeRoom?.beds?.filter((b: Bed) => b.status === 'vacant') || [];

  // Add Tenant Mutation
  const addTenantMutation = useMutation({
    mutationFn: (payload: AddTenantPayload) => tenantApi.addTenant(propertyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pg-tenants', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pg-rooms', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
      setIsOnboardOpen(false);
      resetForm();
    },
  });

  // Vacate Tenant Mutation
  const vacateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VacateTenantPayload }) =>
      tenantApi.vacateTenant(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pg-tenants', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pg-rooms', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
      setVacatingTenant(null);
    },
  });

  const resetForm = () => {
    setTenantName('');
    setTenantPhone('');
    setTenantEmail('');
    setSelectedRoomId('');
    setSelectedBedId('');
    setMonthlyRent('');
    setSecurityDeposit('');
    setEmergencyName('');
    setEmergencyPhone('');
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim() || !tenantPhone.trim() || !monthlyRent) return;

    addTenantMutation.mutate({
      name: tenantName.trim(),
      phone: tenantPhone.trim(),
      email: tenantEmail.trim() || undefined,
      room: selectedRoomId || undefined,
      bed: selectedBedId || undefined,
      monthlyRent: parseFloat(monthlyRent),
      securityDeposit: securityDeposit ? parseFloat(securityDeposit) : 0,
      joinDate,
      foodPreference,
      emergencyContact: emergencyName
        ? { name: emergencyName, phone: emergencyPhone }
        : undefined,
    });
  };

  const handleVacateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacatingTenant) return;

    vacateMutation.mutate({
      id: vacatingTenant._id,
      payload: {
        actualLeaveDate: new Date().toISOString(),
        refundDeposit,
      },
    });
  };

  return (
    <DashboardLayout propertyId={propertyId}>
      <PageHeader
        title="Tenant Registry"
        description="Manage active residents, room assignments, deposits, and vacating workflows."
        breadcrumbs={[
          { label: 'Properties', href: '/dashboard' },
          { label: 'Overview', href: `/properties/${propertyId}` },
          { label: 'Tenants' },
        ]}
      >
        <Button onClick={() => setIsOnboardOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Onboard Tenant</span>
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
          {['all', 'active', 'notice', 'vacated'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                statusFilter === status
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4 text-slate-400" />}
          />
        </div>
      </div>

      {/* Tenants Table */}
      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Users className="h-8 w-8 text-emerald-400" />}
            title="No tenants found"
            description={
              search
                ? 'No residents match your search criteria.'
                : 'No tenants enrolled under this status.'
            }
            actionLabel="Onboard First Tenant"
            onAction={() => setIsOnboardOpen(true)}
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Tenant</th>
                  <th className="px-6 py-4">Room & Bed</th>
                  <th className="px-6 py-4">Monthly Rent</th>
                  <th className="px-6 py-4">Security Deposit</th>
                  <th className="px-6 py-4">Join Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tenants.map((tenant) => {
                  const roomObj = typeof tenant.room === 'object' ? tenant.room : null;
                  const bedObj = typeof tenant.bed === 'object' ? tenant.bed : null;

                  return (
                    <tr
                      key={tenant._id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 font-bold text-white text-xs">
                            {tenant.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{tenant.name}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 text-slate-500" />
                              {formatPhone(tenant.phone)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {roomObj ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-200">
                            <span className="rounded bg-slate-800 px-2 py-0.5">
                              Room {roomObj.roomNumber}
                            </span>
                            {bedObj && (
                              <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5">
                                {bedObj.bedLabel}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Unallocated</span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-mono font-medium text-emerald-400">
                        {formatINR(tenant.monthlyRent || tenant.rentAmount)}
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-300">
                        {formatINR(tenant.securityDeposit)}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400">
                        {formatDate(tenant.joinDate || tenant.joiningDate)}
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            tenant.status === 'active'
                              ? 'default'
                              : tenant.status === 'notice'
                              ? 'warning'
                              : 'secondary'
                          }
                          dot
                        >
                          {tenant.status}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTenant(tenant)}
                            title="View KYC & Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {tenant.status !== 'vacated' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              onClick={() => setVacatingTenant(tenant)}
                              title="Vacate Resident"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onboard Tenant Modal */}
      <Dialog open={isOnboardOpen} onOpenChange={setIsOnboardOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Onboard New Resident</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOnboardSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Full Name *
                </label>
                <Input
                  placeholder="e.g. Rahul Sharma"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Phone (10 digits) *
                </label>
                <Input
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  required
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-300">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="rahul@example.com"
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Room and Bed Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Select Room
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => {
                    setSelectedRoomId(e.target.value);
                    const rm = rooms.find((r) => r._id === e.target.value);
                    if (rm) {
                      setMonthlyRent(String(rm.rentPerBed || rm.rent || ''));
                      setSecurityDeposit(String(rm.deposit || 0));
                    }
                  }}
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Room --</option>
                  {rooms.map((room) => (
                    <option key={room._id} value={room._id}>
                      Room {room.roomNumber} ({room.shareType} sharing)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Select Bed
                </label>
                <select
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  disabled={!selectedRoomId}
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                >
                  <option value="">-- Choose Bed --</option>
                  {availableBeds.map((bed: Bed) => (
                    <option key={bed._id} value={bed._id}>
                      Bed {bed.bedLabel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rent & Deposit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Monthly Rent (₹) *
                </label>
                <Input
                  type="number"
                  placeholder="8500"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  required
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Security Deposit (₹)
                </label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Move-in Date *
                </label>
                <Input
                  type="date"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Food Preference
                </label>
                <select
                  value={foodPreference}
                  onChange={(e) => setFoodPreference(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="veg">Vegetarian</option>
                  <option value="nonveg">Non-Vegetarian</option>
                  <option value="eggetarian">Eggetarian</option>
                  <option value="none">No Food / Self</option>
                </select>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t border-slate-800 pt-3">
              <p className="text-xs font-semibold uppercase text-slate-400 mb-2">
                Emergency Contact (Optional)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Contact Name"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                />
                <Input
                  placeholder="Contact Phone"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOnboardOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={addTenantMutation.isPending}>
                Complete Onboarding
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Tenant Details Modal */}
      <Dialog open={!!selectedTenant} onOpenChange={(open) => !open && setSelectedTenant(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resident Profile</DialogTitle>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-lg border border-emerald-500/20">
                  {selectedTenant.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedTenant.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Phone className="h-3 w-3" />
                    {formatPhone(selectedTenant.phone)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-slate-400">Monthly Rent</p>
                  <p className="text-sm font-bold text-emerald-400 mt-1">
                    {formatINR(selectedTenant.monthlyRent || selectedTenant.rentAmount)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-slate-400">Security Deposit</p>
                  <p className="text-sm font-bold text-white mt-1">
                    {formatINR(selectedTenant.securityDeposit)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-slate-400">Joining Date</p>
                  <p className="text-sm font-bold text-white mt-1">
                    {formatDate(selectedTenant.joinDate || selectedTenant.joiningDate)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-slate-400">Status</p>
                  <div className="mt-1">
                    <Badge variant="default" dot>
                      {selectedTenant.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedTenant.emergencyContact?.name && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs">
                  <p className="font-semibold text-slate-300">Emergency Contact</p>
                  <p className="mt-1 text-slate-400">
                    {selectedTenant.emergencyContact.name} ({selectedTenant.emergencyContact.relationship || 'Guardian'}) —{' '}
                    {formatPhone(selectedTenant.emergencyContact.phone)}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Vacate Tenant Modal */}
      <Dialog open={!!vacatingTenant} onOpenChange={(open) => !open && setVacatingTenant(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vacate Resident: {vacatingTenant?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVacateSubmit} className="space-y-4 mt-2">
            <p className="text-sm text-slate-400 leading-relaxed">
              Vacating this resident will free up their bed allocation and update their status to &apos;vacated&apos;.
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Security Deposit Held:</span>
                <span className="font-bold text-white font-mono">
                  {formatINR(vacatingTenant?.securityDeposit)}
                </span>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={refundDeposit}
                onChange={(e) => setRefundDeposit(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-emerald-500"
              />
              <span>Refund full security deposit to resident</span>
            </label>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setVacatingTenant(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                isLoading={vacateMutation.isPending}
              >
                Confirm & Vacate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
