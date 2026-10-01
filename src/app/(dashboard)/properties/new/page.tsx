'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/ui/page-header';
import { AddPropertyForm } from '@/features/properties/components/AddPropertyForm';

export default function NewPropertyPage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <PageHeader
        title="Add New Property"
        description="Register a new PG or Co-living property into your portfolio."
        breadcrumbs={[
          { label: 'Multi-PG Overview', href: '/dashboard' },
          { label: 'Add New Property' },
        ]}
      />

      <div className="mt-8 max-w-4xl mx-auto">
        <AddPropertyForm
          onSuccess={(propertyId) => {
            router.push(`/properties/${propertyId}`);
          }}
          onCancel={() => {
            router.push('/dashboard');
          }}
        />
      </div>
    </DashboardLayout>
  );
}
