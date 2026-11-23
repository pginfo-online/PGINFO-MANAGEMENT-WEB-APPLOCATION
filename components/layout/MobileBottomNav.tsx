"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Menu } from "lucide-react";
import { isNavigationActive, navigation } from "./navigation";

export default function MobileBottomNav() {
  const path = usePathname();
  return (
    <nav className="workspace-bottom lg:hidden" aria-label="Workspace">
      {navigation.slice(0, 4).map(({ label, href, icon: Icon }) => (
        <Link key={href} href={href} aria-current={isNavigationActive(path, href) ? "page" : undefined}><Icon className="size-5" />{label}</Link>
      ))}
      <Dropdown.Root>
        <Dropdown.Trigger><Menu className="size-5" />More</Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content side="top" align="end" sideOffset={10} className="workspace-menu">
            {navigation.slice(4).map(({ label, href, icon: Icon }) => <Dropdown.Item key={href} asChild><Link href={href}><Icon className="size-4" />{label}</Link></Dropdown.Item>)}
            <Dropdown.Item asChild><Link href="/listings">Listings</Link></Dropdown.Item>
            <Dropdown.Item asChild><Link href="/whatsapp/tenants">WhatsApp</Link></Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
    </nav>
  );
}
