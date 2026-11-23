import Link from "next/link";
import { PageHeading } from "../layout/WorkspaceUI";

export default function FoodMenuSchedule() {
  return (
    <>
      <PageHeading title="Food menu" description="Meal scheduling is unavailable in this workspace." />
      <Link className="workspace-button" href="/property">Back to properties</Link>
    </>
  );
}
