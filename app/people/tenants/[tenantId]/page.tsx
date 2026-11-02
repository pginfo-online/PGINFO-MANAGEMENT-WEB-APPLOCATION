import TenantProfile360 from "@/components/tenants/TenantProfile360";

export default async function TenantDetailsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  return <TenantProfile360 tenantId={tenantId} />;
}
