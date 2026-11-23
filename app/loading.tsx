import { Skeleton } from "@/components/layout/WorkspaceUI";

export default function Loading() {
  return <Skeleton layout="cards" count={8} />;
}
