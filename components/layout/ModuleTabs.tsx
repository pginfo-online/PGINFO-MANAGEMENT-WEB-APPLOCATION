"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = {
  property: [["Rooms", "/property"], ["Inventory", "/property/rooms"], ["Bed availability", "/property/bed-availability"], ["Complaints", "/property/complaints"], ["Meters", "/property/meters"]],
  people: [["Tenants", "/people/tenants"], ["Former tenants", "/people/oldTenant"], ["Leads", "/people/leads"], ["Bookings", "/people/bookings"], ["Team", "/people/team"]],
  money: [["Overview", "/money"], ["Dues", "/money/dues"], ["Collections", "/money/collection"], ["Expenses", "/money/expense"], ["Packages", "/money/dues-package"], ["Bank accounts", "/money/banks"], ["Reports", "/reports"]],
};

export default function ModuleTabs({ module }: { module: keyof typeof links }) {
  const path = usePathname();
  return (
    <nav aria-label={module + " views"} className="workspace-tabs">
      {links[module].map(([label, href]) => {
        const active = path === href || (module === "people" && path === "/people" && href === "/people/tenants");
        return <Link href={href} key={href} aria-current={active ? "page" : undefined}>{label}</Link>;
      })}
    </nav>
  );
}
