"use client";

import { QueryError } from "@/components/layout/WorkspaceUI";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return <QueryError error={error} retry={reset} />;
}
