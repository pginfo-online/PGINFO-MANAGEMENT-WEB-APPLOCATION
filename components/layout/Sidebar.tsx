"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  Wallet,
  Users,
  Building2,
  Briefcase,
  MessageCircle,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  PackageCheck,
  Receipt,
  CreditCard,
  Building,
  UserPlus,
  CalendarDays,
  UserCheck,
  Sparkles,
  Bed,
  UtensilsCrossed,
  History,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authStorage } from "@/lib/api/client";
import { toast } from "sonner";

interface MenuItem {
  title: string;
  icon: LucideIcon;
  href?: string;
  badge?: string;
  children?: {
    title: string;
    href: string;
    icon?: LucideIcon;
    badge?: string;
  }[];
}

const TOUCH_LAYOUT_QUERY = "(hover: none) and (min-width: 1024px)";

function subscribeToTouchLayout(onChange: () => void) {
  const mediaQuery = window.matchMedia(TOUCH_LAYOUT_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getTouchLayoutSnapshot() {
  return window.matchMedia(TOUCH_LAYOUT_QUERY).matches;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isHovering, setIsHovering] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const isTouchLayout = useSyncExternalStore(
    subscribeToTouchLayout,
    getTouchLayoutSnapshot,
    () => false
  );
  const isExpanded = isHovering || isFocusWithin || isTouchLayout;

  // Submenu collapse states
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Money: false,
    People: false,
    Property: true,
    Operations: false,
    Genie: false,
  });

  // Keep active category open
  useEffect(() => {
    if (pathname.startsWith("/property")) {
      setOpenMenus((prev) => ({ ...prev, Property: true }));
    } else if (pathname.startsWith("/people")) {
      setOpenMenus((prev) => ({ ...prev, People: true }));
    } else if (pathname.startsWith("/money")) {
      setOpenMenus((prev) => ({ ...prev, Money: true }));
    }
  }, [pathname]);

  const toggleSubmenu = (title: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/analytics",
      badge: "Beta",
    },
    {
      title: "Home",
      icon: Home,
      href: "/home",
    },
    {
      title: "Money",
      icon: Wallet,
      children: [
        { title: "Dues Package", href: "/money/dues-package", icon: PackageCheck },
        { title: "Dues", href: "/money/dues", icon: Receipt },
        { title: "Collection", href: "/money/collection", icon: CreditCard },
        { title: "Expense", href: "/money/expense", icon: FileText },
        { title: "Bank", href: "/banks", icon: Building },
        { title: "FlexiPe", href: "/flexipe", icon: Sparkles },
      ],
    },
    {
      title: "People",
      icon: Users,
      children: [
        { title: "Tenants", href: "/people/tenants", icon: Users },
        { title: "Add Tenants", href: "/people/tenants/addTenant", icon: UserPlus },
        { title: "Bookings", href: "/people/bookings", icon: CalendarDays },
        { title: "Old Tenants", href: "/people/oldTenant", icon: UserCheck },
        { title: "Leads", href: "/people/leads", icon: Sparkles },
        { title: "Teams", href: "/people/team", icon: Briefcase },
      ],
    },
    {
      title: "Property",
      icon: Building2,
      children: [
        { title: "Rooms", href: "/property/rooms", icon: Bed },
        { title: "Food", href: "/property/food", icon: UtensilsCrossed },
        { title: "Timeline", href: "/property/bed-availability", icon: History },
        { title: "Reviews", href: "/property/complaints", icon: Star },
        { title: "Listings", href: "/listings", icon: Building2 },
      ],
    },
    {
      title: "Operations",
      icon: Briefcase,
      children: [
        { title: "Reports", href: "/reports", icon: FileText },
        { title: "Settings", href: "/settings", icon: Settings },
      ],
    },
    {
      title: "Genie",
      icon: MessageCircle,
      children: [
        { title: "WhatsApp Reminders", href: "/whatsapp/tenants", icon: MessageCircle },
      ],
    },
    {
      title: "Reports",
      icon: FileText,
      href: "/reports",
    },
  ];

  const handleSignOut = () => {
    authStorage.clear();
    toast.success("Signed out successfully");
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <aside
      className={cn(
        "app-sidebar hidden lg:flex flex-col border-r text-slate-100 select-none overflow-y-auto overflow-x-hidden z-30 shrink-0",
        isExpanded ? "w-[19.375rem]" : "w-[5.25rem]"
      )}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setIsHovering(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") {
          setIsHovering(false);
          setIsFocusWithin(false);
        }
      }}
      onFocus={() => setIsFocusWithin(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsFocusWithin(false);
        }
      }}
    >
      {/* Navigation Links */}
      <div className="flex flex-col p-2 space-y-1.5 flex-1">
        {menuItems.map((item) => {
          const hasChildren = Boolean(item.children?.length);
          const isItemActive = item.href ? pathname === item.href : false;
          const isChildActive = hasChildren
            ? item.children!.some((child) => pathname === child.href)
            : false;
          const isOpen = openMenus[item.title];

          // Collapsed Icon-Only View
          if (!isExpanded) {
            const active = isItemActive || isChildActive;
            const targetHref = item.href || item.children?.[0]?.href || "#";

            return (
              <div key={item.title} className="relative group flex justify-center py-0.5">
                <Link
                  href={targetHref}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-2xl transition duration-200",
                    active
                      ? "bg-[#2F54EB] text-white shadow-lg shadow-blue-600/30 font-semibold"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                  )}
                  title={item.title}
                >
                  <item.icon className="h-5 w-5" />
                </Link>

                {/* Tooltip on hover */}
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-700 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap top-1/2 -translate-y-1/2">
                  {item.title}
                </div>
              </div>
            );
          }

          // Expanded Full View
          if (hasChildren) {
            return (
              <div key={item.title} className="flex flex-col">
                <button
                  onClick={() => toggleSubmenu(item.title)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium transition cursor-pointer group",
                    isChildActive
                      ? "text-blue-400 bg-blue-950/20"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition",
                        isChildActive
                          ? "text-blue-400"
                          : "text-slate-400 group-hover:text-slate-200"
                      )}
                    />
                    <span>{item.title}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-slate-500 transition-transform duration-200",
                      isOpen ? "transform rotate-0" : "-rotate-90"
                    )}
                  />
                </button>

                {/* Submenu Items */}
                {isOpen && (
                  <div className="ml-5 mt-1 pl-3 border-l border-slate-800/80 space-y-1">
                    {item.children!.map((child) => {
                      const active = pathname === child.href;
                      const Icon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition",
                            active
                              ? "bg-[#2F54EB] text-white shadow-md shadow-blue-500/25 font-bold"
                              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            {Icon && <Icon className="h-4 w-4 opacity-90" />}
                            <span>{child.title}</span>
                          </div>
                          {child.badge && (
                            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300">
                              {child.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium transition group",
                isItemActive
                  ? "bg-[#2F54EB] text-white shadow-lg shadow-blue-600/30 font-semibold"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    isItemActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    isItemActive
                      ? "bg-white/20 text-white"
                      : "bg-blue-900/60 text-blue-400 border border-blue-700/50"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Sticky Section */}
      <div className="p-2 border-t border-white/10 space-y-1">
        {!isExpanded ? (
          <div className="flex flex-col items-center space-y-2 py-1">
            <Link
              href="/settings"
              title="Settings"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl transition",
                pathname === "/settings"
                  ? "bg-[#2F54EB] text-white"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
              )}
            >
              <Settings className="h-5 w-5" />
            </Link>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <>
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition",
                pathname === "/settings"
                  ? "bg-[#2F54EB] text-white"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              )}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
