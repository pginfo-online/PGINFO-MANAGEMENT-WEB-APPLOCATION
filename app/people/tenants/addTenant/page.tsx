import { Suspense } from "react";
import AddTenantWizard from "@/components/tenants/AddTenantWizard";

import { Skeleton } from "@/components/layout/WorkspaceUI";

export default function AddTenantPage() {
  return (
    <Suspense fallback={<Skeleton count={4} />}>
      <AddTenantWizard />
    </Suspense>
  );
}
