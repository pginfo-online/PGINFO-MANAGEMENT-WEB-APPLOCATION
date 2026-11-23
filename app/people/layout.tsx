import type { ReactNode } from "react";
import ModuleTabs from "@/components/layout/ModuleTabs";

export default function ModuleLayout({ children }: { children: ReactNode }) {
  return <><ModuleTabs module="people" />{children}</>;
}
