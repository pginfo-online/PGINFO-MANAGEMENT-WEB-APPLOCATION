'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck,
  Plus,
  Phone,
  Trash2,
  Calendar,
  IndianRupee,
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
import { staffApi } from '@/features/staff/api/staff.api';
import { formatINR, formatDate, formatPhone } from '@/lib/utils';
import type { Staff, StaffRole, CreateStaffPayload } from '@/types/staff';

export default function StaffManagementPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('manager');
  const [salary, setSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [canManageTenants, setCanManageTenants] = useState(false);
  const [canCollectRent, setCanCollectRent] = useState(false);
  const [canManageExpenses, setCanManageExpenses] = useState(false);

  // Fetch Staff
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['pg-staff', propertyId],
    queryFn: () => staffApi.getStaffList(propertyId),
    enabled: !!propertyId,
  });

  const staffList: Staff[] = staffData?.data || [];

  // Add Staff Mutation
  const addStaffMutation = useMutation({
    mutationFn: (payload: CreateStaffPayload) => staffApi.addStaff(propertyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pg-staff', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  // Delete Staff Mutation
  const deleteStaffMutation = useMutation({
    mutationFn: (id: string) => staffApi.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pg-staff', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
    },
  });

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setSalary('');
    setCanManageTenants(false);
    setCanCollectRent(false);
    setCanManageExpenses(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    addStaffMutation.mutate({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      role,
      salary: salary ? parseFloat(salary) : undefined,
      joiningDate,
      permissions: {
        canManageTenants,
        canCollectRent,
        canManageExpenses,
        canViewReports: false,
        canManageStaff: false,
      },
    });
  };

  const roles: StaffRole[] = [
    'manager',
    'property_manager',
    'security',
    'cleaner',
    'cook',
    'electrician',
    'plumber',
    'gardener',
    'other',
  ];

  return (
    <DashboardLayout propertyId={propertyId}>
      <PageHeader
        title="Staff & Crew Roster"
        description="Manage on-site employees, maintenance personnel, duties, and role permissions."
        breadcrumbs={[
          { label: 'Properties', href: '/dashboard' },
          { label: 'Overview', href: `/properties/${propertyId}` },
          { label: 'Staff' },
        ]}
      >
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add Staff Member</span>
        </Button>
      </PageHeader>

      {/* Staff Grid */}
      {isLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : staffList.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<UserCheck className="h-8 w-8 text-emerald-400" />}
            title="No staff members registered"
            description="Add managers, security guards, cleaners, or cooks to delegate PG operations."
            actionLabel="Add First Staff Member"
            onAction={() => setIsAddOpen(true)}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {staffList.map((staff) => (
            <div
              key={staff._id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-white font-bold text-base">
                      {staff.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{staff.name}</h3>
                      <p className="text-xs font-semibold capitalize text-emerald-400">
                        {staff.role.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" dot>
                    {staff.status}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    <span>{formatPhone(staff.phone)}</span>
                  </p>
                  {staff.salary && (
                    <p className="flex items-center gap-2">
                      <IndianRupee className="h-3.5 w-3.5 text-slate-500" />
                      <span>{formatINR(staff.salary)} / month</span>
                    </p>
                  )}
                  {staff.joiningDate && (
                    <p className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>Joined {formatDate(staff.joiningDate)}</span>
                    </p>
                  )}
                </div>

                {/* Permissions Badges */}
                <div className="mt-4 border-t border-slate-800/80 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Delegated Privileges
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {staff.permissions?.canManageTenants && (
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                        Manage Tenants
                      </span>
                    )}
                    {staff.permissions?.canCollectRent && (
                      <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px]">
                        Collect Rent
                      </span>
                    )}
                    {staff.permissions?.canManageExpenses && (
                      <span className="rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[10px]">
                        Log Expenses
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-3">
                <span className="text-xs text-slate-500">Staff ID: {staff.phone}</span>
                <button
                  onClick={() => {
                    if (confirm(`Remove staff member ${staff.name}?`)) {
                      deleteStaffMutation.mutate(staff._id);
                    }
                  }}
                  className="text-slate-500 hover:text-rose-400 transition-colors"
                  title="Remove Staff"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-300">
                Staff Name *
              </label>
              <Input
                placeholder="e.g. Suresh Gowda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Mobile Number *
                </label>
                <Input
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 capitalize"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Monthly Salary (₹)
                </label>
                <Input
                  type="number"
                  placeholder="18000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Joining Date
                </label>
                <Input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Permissions */}
            <div className="border-t border-slate-800 pt-3">
              <p className="text-xs font-semibold uppercase text-slate-400 mb-2">
                Operational Permissions
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canManageTenants}
                    onChange={(e) => setCanManageTenants(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500"
                  />
                  <span>Can manage resident onboarding & bed allocations</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canCollectRent}
                    onChange={(e) => setCanCollectRent(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500"
                  />
                  <span>Can record offline rent payments</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canManageExpenses}
                    onChange={(e) => setCanManageExpenses(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500"
                  />
                  <span>Can submit property expense receipts</span>
                </label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={addStaffMutation.isPending}>
                Save Staff Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
