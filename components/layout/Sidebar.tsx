"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users } from "lucide-react";
import { isNavigationActive, navigation } from "./navigation";

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="workspace-sidebar hidden lg:flex">
      <Link href="/" className="workspace-brand"><span><Building2 className="size-5" /></span>PgInfo</Link>
      <nav aria-label="Workspace" className="mt-9 space-y-1">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = isNavigationActive(path, href);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined}><Icon className="size-4" />{label}</Link>;
        })}
        <Link href="/listings"><Building2 className="size-4" />Listings</Link>
        <Link href="/whatsapp/tenants"><Users className="size-4" />WhatsApp</Link>
      </nav>
    </aside>
  );
}
