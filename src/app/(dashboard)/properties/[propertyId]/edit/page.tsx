'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/ui/page-header';
import { EditPropertyForm } from '@/features/properties/components/EditPropertyForm';

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;

  return (
    <DashboardLayout propertyId={propertyId}>
      <PageHeader
        title="Edit PG Property"
        description="Update property details, address, contact numbers, amenities, and photos."
        breadcrumbs={[
          { label: 'Properties', href: '/dashboard' },
          { label: 'Property Dashboard', href: `/properties/${propertyId}` },
          { label: 'Edit Property' },
        ]}
      />

      <div className="mt-8">
        <EditPropertyForm
          propertyId={propertyId}
          onSuccess={() => {
            router.push(`/properties/${propertyId}`);
          }}
          onCancel={() => {
            router.push(`/properties/${propertyId}`);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
