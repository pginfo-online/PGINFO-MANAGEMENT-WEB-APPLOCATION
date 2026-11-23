import { Building2, ChartNoAxesCombined, CircleHelp, LayoutDashboard, Settings, Users, Wallet } from "lucide-react";

export const navigation = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Property", href: "/property", icon: Building2 },
  { label: "People", href: "/people", icon: Users },
  { label: "Money", href: "/money", icon: Wallet },
  { label: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
  { label: "Reports", href: "/reports", icon: CircleHelp },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function isNavigationActive(path: string, href: string) {
  return href === "/" ? path === "/" || path === "/home" : path === href || path.startsWith(href + "/");
}
