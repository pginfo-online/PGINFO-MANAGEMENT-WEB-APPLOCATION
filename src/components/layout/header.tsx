'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  ShieldCheck,
  Check,
  PlusCircle,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth/store';
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  propertyId?: string;
  onOpenMobileMenu?: () => void;
}

export function Header({ propertyId, onOpenMobileMenu }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth, setActivePropertyId } = useAuthStore();

  const { data: dashboardData } = useQuery({
    queryKey: ['owner-dashboard'],
    queryFn: () => dashboardApi.getOwnerDashboard(),
    staleTime: 1000 * 60 * 5,
  });

  const pgs = dashboardData?.data?.pgs || [];
  const currentPg = pgs.find((p) => p._id === propertyId);

  const handleSelectProperty = (id: string | null) => {
    setActivePropertyId(id);
    if (!id) {
      router.push('/dashboard');
    } else {
      // If we are currently on a sub-route like /properties/X/rooms, stay on that sub-route for new property
      const segments = pathname.split('/');
      if (segments.length >= 4 && segments[1] === 'properties') {
        const subRoute = segments.slice(3).join('/');
        router.push(`/properties/${id}/${subRoute}`);
      } else {
        router.push(`/properties/${id}`);
      }
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-4 md:px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-slate-400 hover:text-white"
          onClick={onOpenMobileMenu}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* PG Property Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-left text-sm transition-all hover:border-slate-700 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-100 max-w-[140px] truncate sm:max-w-[200px]">
                    {currentPg ? currentPg.name : 'Multi-PG Overview'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </div>
                {currentPg && (
                  <p className="text-[10px] text-slate-400">
                    {currentPg.area ? `${currentPg.area}, ` : ''}{currentPg.city || 'India'}
                  </p>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <div className="px-2 py-1.5 text-xs font-semibold text-slate-400">
              Switch Property Context
            </div>
            <DropdownMenuItem
              onClick={() => handleSelectProperty(null)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 text-slate-300">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <span>All Properties (Overview)</span>
              </div>
              {!propertyId && <Check className="h-4 w-4 text-emerald-400" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {pgs.map((pg) => (
              <DropdownMenuItem
                key={pg._id}
                onClick={() => handleSelectProperty(pg._id)}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-slate-200">{pg.name}</p>
                  <p className="text-xs text-slate-500">
                    {pg.area ? `${pg.area}, ` : ''}{pg.city || ''}
                  </p>
                </div>
                {propertyId === pg._id && (
                  <Check className="h-4 w-4 text-emerald-400" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push('/properties/new')}
              className="flex items-center gap-2.5 text-emerald-400 font-semibold hover:text-emerald-300 focus:text-emerald-300 focus:bg-emerald-500/10 cursor-pointer py-2"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <PlusCircle className="h-4 w-4" />
              </div>
              <span>Add New Property</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right User Navigation */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-full border border-slate-800 bg-slate-900/60 py-1 pl-1.5 pr-3 transition-colors hover:border-slate-700 hover:bg-slate-900 focus:outline-none">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-xs font-bold text-slate-950">
                {user?.name ? user.name.slice(0, 1).toUpperCase() : 'O'}
              </div>
              <span className="hidden text-xs font-medium text-slate-200 sm:inline max-w-[100px] truncate">
                {user?.name || 'Property Owner'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-semibold text-white">{user?.name || 'Owner'}</p>
              <p className="text-xs text-slate-400">{user?.phone || user?.email || ''}</p>
              <div className="mt-2 inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" />
                Verified Owner Mode
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} destructive className="text-rose-400">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
