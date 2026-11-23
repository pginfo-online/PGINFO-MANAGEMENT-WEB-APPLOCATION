import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

export function PageHeading({ title, description, action }: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ layout = "rows", count = 4 }: {
  layout?: "rows" | "cards" | "metrics";
  count?: number;
}) {
  return (
    <div role="status" className={layout === "rows" ? "space-y-2" : "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"}>
      <span className="sr-only">Loading</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} aria-hidden="true" className={`workspace-card flex flex-col justify-center gap-3 p-5 ${layout === "cards" ? "min-h-44" : layout === "metrics" ? "min-h-28" : "min-h-16"}`}>
          <div className="skeleton-bar h-3 w-1/3" />
          <div className="skeleton-bar h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function QueryError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div role="alert" className="workspace-card flex flex-wrap items-center gap-3 p-5 text-sm">
      <AlertCircle className="size-5 text-rose-600" />
      <span className="flex-1">{error.message}</span>
      <button className="workspace-button" type="button" onClick={retry}>Try again</button>
    </div>
  );
}
