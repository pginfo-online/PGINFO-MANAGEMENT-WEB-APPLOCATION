"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import PropertySelectorModal from "@/components/layout/PropertySelectorModal";
import GlobalSearchDialog from "@/components/layout/GlobalSearchDialog";
import AddRentDuesDrawer from "@/components/drawers/AddRentDuesDrawer";
import CollectPaymentDrawer from "@/components/drawers/CollectPaymentDrawer";
import AddExpenseModal from "@/components/drawers/AddExpenseModal";
import AddRoomModal from "@/components/drawers/AddRoomModal";
import EditRoomModal from "@/components/drawers/EditRoomModal";
import AddComplaintModal from "@/components/drawers/AddComplaintModal";
import AddStaffModal from "@/components/drawers/AddStaffModal";
import AnnouncementsModal from "@/components/drawers/AnnouncementsModal";
import AddPropertyModal from "@/components/drawers/AddPropertyModal";
import { authStorage } from "@/lib/api/client";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    let mounted = true;

    function checkAuth() {
      const token = authStorage.getToken();

      if (isAuthRoute) {
        // If already logged in and visiting login/signup, redirect to home
        if (token) {
          router.replace("/home");
        } else {
          if (mounted) setIsVerifying(false);
        }
        return;
      }

      // If on protected route without token, redirect to login
      if (!token) {
        router.replace("/login");
      } else {
        if (mounted) setIsVerifying(false);
      }
    }

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [pathname, isAuthRoute, router]);

  // If on login or signup screen, render directly without the dashboard shell
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Brief loading screen while verifying session
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090E24] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Loading PgInfo workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FF] text-slate-900 antialiased">
      {/* Top Header */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Dark Navy Sidebar */}
        <Sidebar />

        {/* Main Application Viewport */}
        <main className="min-w-0 flex-1 overflow-y-auto bg-[#F4F7FF] p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Global Drawers & Modals */}
      <PropertySelectorModal />
      <GlobalSearchDialog />
      <AddRentDuesDrawer />
      <CollectPaymentDrawer />
      <AddExpenseModal />
      <AddRoomModal />
      <EditRoomModal />
      <AddComplaintModal />
      <AddStaffModal />
      <AnnouncementsModal />
      <AddPropertyModal />
    </div>
  );
}
