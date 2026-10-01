'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Download,
  RefreshCw,
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
import { agreementApi } from '@/features/agreements/api/agreement.api';
import { tenantApi } from '@/features/tenants/api/tenant.api';
import { formatINR, formatDate } from '@/lib/utils';
import type { Agreement, CreateAgreementPayload } from '@/types/agreement';
import type { Tenant } from '@/types/tenant';

export default function AgreementsManagementPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split('T')[0]
  );
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [noticePeriodDays, setNoticePeriodDays] = useState('30');

  // Fetch Agreements
  const { data: agreementsData, isLoading } = useQuery({
    queryKey: ['pg-agreements', propertyId],
    queryFn: () => agreementApi.getAgreements(propertyId),
    enabled: !!propertyId,
  });

  // Fetch Tenants for dropdown
  const { data: tenantsData } = useQuery({
    queryKey: ['pg-tenants-list', propertyId],
    queryFn: () => tenantApi.getTenants(propertyId, { status: 'active' }),
    enabled: !!propertyId && isCreateOpen,
  });

  const rawAgreements = agreementsData?.data;
  const agreements: Agreement[] = Array.isArray(rawAgreements)
    ? rawAgreements
    : Array.isArray((rawAgreements as { agreements?: Agreement[] })?.agreements)
    ? (rawAgreements as { agreements: Agreement[] }).agreements
    : [];
  const tenants: Tenant[] = tenantsData?.data || [];

  // Create Agreement Mutation
  const createAgreementMutation = useMutation({
    mutationFn: (payload: CreateAgreementPayload) =>
      agreementApi.createAgreement(propertyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pg-agreements', propertyId] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  // Regenerate PDF Mutation
  const regenerateMutation = useMutation({
    mutationFn: (id: string) => agreementApi.regeneratePdf(id),
    onSuccess: () => {
      alert('Agreement PDF generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['pg-agreements', propertyId] });
    },
  });

  const resetForm = () => {
    setSelectedTenantId('');
    setMonthlyRent('');
    setSecurityDeposit('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId || !monthlyRent) return;

    createAgreementMutation.mutate({
      tenantId: selectedTenantId,
      startDate,
      endDate,
      monthlyRent: parseFloat(monthlyRent),
      securityDeposit: securityDeposit ? parseFloat(securityDeposit) : 0,
      noticePeriodDays: parseInt(noticePeriodDays, 10) || 30,
    });
  };

  return (
    <DashboardLayout propertyId={propertyId}>
      <PageHeader
        title="Rental Agreements"
        description="Legally compliant digital rental agreements, duration tracking, and PDF contracts."
        breadcrumbs={[
          { label: 'Properties', href: '/dashboard' },
          { label: 'Overview', href: `/properties/${propertyId}` },
          { label: 'Agreements' },
        ]}
      >
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          <span>New Agreement</span>
        </Button>
      </PageHeader>

      {/* Agreements Table */}
      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : agreements.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<FileText className="h-8 w-8 text-emerald-400" />}
            title="No digital agreements recorded"
            description="Create formal rental contracts with duration terms, rent locks, and auto-generated PDFs."
            actionLabel="Create First Agreement"
            onAction={() => setIsCreateOpen(true)}
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Agreement #</th>
                  <th className="px-6 py-4">Resident</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Monthly Rent</th>
                  <th className="px-6 py-4">Deposit</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">PDF Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {agreements.map((agreement) => (
                  <tr
                    key={agreement._id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-white text-xs">
                      {agreement.agreementNumber}
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">
                          {agreement.tenant?.name || 'Resident'}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {agreement.room ? `Room ${agreement.room.roomNumber}` : ''}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400">
                      {formatDate(agreement.startDate)} to{' '}
                      {formatDate(agreement.endDate)}
                    </td>

                    <td className="px-6 py-4 font-mono font-medium text-emerald-400">
                      {formatINR(agreement.monthlyRent)}
                    </td>

                    <td className="px-6 py-4 font-mono text-slate-300">
                      {formatINR(agreement.securityDeposit)}
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant="default" dot>
                        {agreement.status}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {agreement.pdfUrl ? (
                          <a
                            href={agreement.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="subtle" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </a>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => regenerateMutation.mutate(agreement._id)}
                            isLoading={regenerateMutation.isPending}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Generate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Agreement Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Digital Agreement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-300">
                Select Resident *
              </label>
              <select
                value={selectedTenantId}
                onChange={(e) => {
                  setSelectedTenantId(e.target.value);
                  const t = tenants.find((item) => item._id === e.target.value);
                  if (t) {
                    setMonthlyRent(String(t.monthlyRent || t.rentAmount || ''));
                    setSecurityDeposit(String(t.securityDeposit || 0));
                  }
                }}
                required
                className="mt-1 flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- Choose Resident --</option>
                {tenants.map((tenant) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name} ({tenant.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Start Date *
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  End Date *
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Monthly Rent (₹) *
                </label>
                <Input
                  type="number"
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
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-300">
                Notice Period (Days)
              </label>
              <Input
                type="number"
                value={noticePeriodDays}
                onChange={(e) => setNoticePeriodDays(e.target.value)}
                className="mt-1 font-mono"
              />
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={createAgreementMutation.isPending}>
                Create & Generate PDF
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
