import { Suspense } from "react";
import AddTenantWizard from "@/components/tenants/AddTenantWizard";

export default function AddTenantPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading wizard...</div>}>
      <AddTenantWizard />
    </Suspense>
  );
}
