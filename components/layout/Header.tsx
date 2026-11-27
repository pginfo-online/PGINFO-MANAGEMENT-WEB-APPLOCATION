"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Building2, ChevronDown, LogOut, Search, Settings } from "lucide-react";
import { authActions, authStorage } from "@/lib/api/client";
import { usePropertyStore, useUiStore } from "@/lib/store";

export default function Header() {
  const name = usePropertyStore((state) => state.activePropertyName);
  const { setSearchOpen, setPropertySelectorOpen } = useUiStore();
  const user = authStorage.getUser();

  useEffect(() => {
    function search(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (document.querySelector('[aria-modal="true"]')) return;
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", search);
    return () => window.removeEventListener("keydown", search);
  }, [setSearchOpen]);

  return (
    <header className="workspace-header">
      <button className="workspace-button min-w-0" onClick={() => setPropertySelectorOpen(true)}>
        <Building2 className="size-4 shrink-0" /><span className="truncate">{name}</span><ChevronDown className="size-4 shrink-0" />
      </button>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button className="workspace-button" aria-label="Search workspace" onClick={() => setSearchOpen(true)}>
          <Search className="size-4" /><span className="hidden sm:inline">Search</span><kbd className="hidden rounded border border-slate-200 px-1 text-xs text-slate-600 sm:inline">Ctrl/⌘ K</kbd>
        </button>
        <Dropdown.Root>
          <Dropdown.Trigger className="workspace-avatar" aria-label="Account menu">{user?.firstName?.[0]?.toUpperCase() ?? "P"}</Dropdown.Trigger>
          <Dropdown.Portal>
            <Dropdown.Content className="workspace-menu" align="end" sideOffset={8}>
              <Dropdown.Label className="px-3 py-2">
                <span className="block font-semibold">{[user?.firstName, user?.lastName].filter(Boolean).join(" ")}</span>
                <span className="block text-xs text-slate-600">{user?.email || (user?.mobile ? `+91 ${user.mobile}` : "")}</span>
              </Dropdown.Label>
              <Dropdown.Separator className="my-1 border-t border-slate-200" />
              <Dropdown.Item asChild><Link href="/settings"><Settings className="size-4" /> Settings</Link></Dropdown.Item>
              <Dropdown.Item onSelect={() => void authActions.logout()}><LogOut className="size-4" /> Sign out</Dropdown.Item>
            </Dropdown.Content>
          </Dropdown.Portal>
        </Dropdown.Root>
      </div>
    </header>
  );
}
