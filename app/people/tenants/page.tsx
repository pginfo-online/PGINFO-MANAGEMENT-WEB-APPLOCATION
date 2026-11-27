import { Suspense } from "react";
import TenantDirectoryTable from "@/components/tenants/TenantDirectoryTable";
import { Skeleton } from "@/components/layout/WorkspaceUI";

export default function TenantsPage() {
  return (
    <Suspense fallback={<Skeleton layout="cards" count={6} />}>
      <TenantDirectoryTable />
    </Suspense>
  );
}
