import { Suspense } from "react";
import OldTenantsView from "@/components/people/OldTenantsView";
import { Skeleton } from "@/components/layout/WorkspaceUI";

export default function OldTenantsPage() {
  return (
    <Suspense fallback={<Skeleton layout="cards" count={6} />}>
      <OldTenantsView />
    </Suspense>
  );
}
