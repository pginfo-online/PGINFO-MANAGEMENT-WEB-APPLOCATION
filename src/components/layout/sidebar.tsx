'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  Users,
  Receipt,
  Wallet,
  UserCheck,
  FileText,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth/store';

interface SidebarProps {
  propertyId?: string;
  onCloseMobile?: () => void;
}

export function Sidebar({ propertyId, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const storePropertyId = useAuthStore((s) => s.activePropertyId);
  const activePropertyId = propertyId || storePropertyId;

  // If a property is selected, scope routes to that property. Otherwise, general routes.
  const navItems = [
    {
      label: 'Multi-PG Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    ...(activePropertyId
      ? [
          {
            label: 'Property Dashboard',
            href: `/properties/${activePropertyId}`,
            icon: Building2,
            exact: true,
          },
          {
            label: 'Rooms & Beds',
            href: `/properties/${activePropertyId}/rooms`,
            icon: BedDouble,
          },
          {
            label: 'Tenants',
            href: `/properties/${activePropertyId}/tenants`,
            icon: Users,
          },
          {
            label: 'Rent Collection',
            href: `/properties/${activePropertyId}/rent`,
            icon: Receipt,
          },
          {
            label: 'Expenses & P&L',
            href: `/properties/${activePropertyId}/expenses`,
            icon: Wallet,
          },
          {
            label: 'Staff Roster',
            href: `/properties/${activePropertyId}/staff`,
            icon: UserCheck,
          },
          {
            label: 'Agreements',
            href: `/properties/${activePropertyId}/agreements`,
            icon: FileText,
          },
          {
            label: 'Analytics & P&L',
            href: `/properties/${activePropertyId}/reports`,
            icon: BarChart3,
          },
          {
            label: 'PG Settings',
            href: `/properties/${activePropertyId}/settings`,
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[var(--border-main)] dark:border-slate-800/80 bg-white dark:bg-slate-950/80 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-[var(--border-main)] dark:border-slate-800/80 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-sm">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black tracking-tight text-[var(--text-main)] dark:text-white">PGinfo</span>
            <span className="rounded bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              OWNER
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] dark:text-slate-400">Enterprise Management</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {activePropertyId && (
          <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] dark:text-slate-500">
            Property Management
          </div>
        )}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={onCloseMobile}
                data-active={isActive ? 'true' : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[var(--gold-pale)] text-[var(--gold-strong)] font-bold border border-[var(--gold-light)] shadow-sm dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                    : 'text-[var(--text-sub)] hover:bg-[var(--bg-card-subtle)] hover:text-[var(--text-main)] dark:text-slate-400 dark:hover:bg-slate-900/90 dark:hover:text-slate-200'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive ? 'text-[var(--gold-strong)] dark:text-emerald-400' : 'text-[var(--text-muted)] dark:text-slate-500 group-hover:text-[var(--text-main)] dark:group-hover:text-slate-300'
                  )}
                />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--gold)] dark:bg-emerald-400 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Banner */}
      <div className="p-4 border-t border-[var(--border-main)] dark:border-slate-800/80">
        <div className="rounded-xl border border-[var(--border-main)] dark:border-slate-800/90 bg-[var(--bg-card-subtle)] dark:bg-slate-900/60 p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--gold)] dark:text-emerald-400" />
            <span className="text-xs font-bold text-[var(--text-main)] dark:text-white">Smart Automation</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)] dark:text-slate-400 leading-relaxed">
            WhatsApp rent reminders & Razorpay UPI collection enabled.
          </p>
        </div>
      </div>
    </aside>
  );
}
