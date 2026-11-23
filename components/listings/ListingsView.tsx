import Link from "next/link";
import { PageHeading } from "../layout/WorkspaceUI";

export default function ListingsView() {
  return (
    <>
      <PageHeading title="Room listings" description="Publish or unpublish rooms from the property inventory." />
      <Link href="/property/rooms" className="workspace-button primary">Open room inventory</Link>
    </>
  );
}
