"use client";

import React, { useEffect, useSyncExternalStore } from "react";
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
import { Skeleton } from "./WorkspaceUI";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { authStorage } from "@/lib/api/client";

interface AppShellProps {
  children: React.ReactNode;
}

function readSession() {
  return Boolean(authStorage.getToken());
}

function subscribeToStorage(notify: () => void) {
  const identity = () => JSON.stringify([authStorage.getUser()?.id, authStorage.getOrgId()]);
  let scope = identity();
  function sync() {
    scope = identity();
    if (readSession()) usePropertyStore.getState().restoreSelection();
    notify();
  }
  function onStorage() {
    if (identity() !== scope) {
      window.location.reload();
      return;
    }
    sync();
  }
  sync();
  window.addEventListener("storage", onStorage);
  window.addEventListener("pginfo-session", sync);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("pginfo-session", sync);
  };
}

export default function AppShell({ children }: AppShellProps) {
  const isAddRoomOpen = useUiStore((state) => state.isAddRoomOpen);
  const isAddStaffOpen = useUiStore((state) => state.isAddStaffOpen);
  const pathname = usePathname();
  const router = useRouter();
  const hasSession = useSyncExternalStore(subscribeToStorage, readSession, () => null);
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    if (hasSession === false && !isAuthRoute) {
      const next = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [hasSession, isAuthRoute, router]);

  if (isAuthRoute) return children;
  if (!hasSession) return <main className="mx-auto max-w-5xl p-8"><Skeleton layout="cards" count={8} /></main>;

  return (
    <div className="workspace-shell">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:bg-white focus:p-3">Skip to content</a>
      <Sidebar />
      <div className="min-w-0 lg:ml-[14rem]">
        <Header />
        <main id="main-content" className="mx-auto max-w-screen-2xl px-4 pt-5 pb-24 sm:px-7 sm:pt-8 lg:px-9 lg:pb-10">
          <div key={pathname} className="workspace-enter">{children}</div>
        </main>
      </div>
      <MobileBottomNav />

      {/* Global Drawers & Modals */}
      <PropertySelectorModal />
      <GlobalSearchDialog />
      <AddRentDuesDrawer />
      <CollectPaymentDrawer />
      <AddExpenseModal />
      {isAddRoomOpen && <AddRoomModal />}
      <EditRoomModal />
      <AddComplaintModal />
      {isAddStaffOpen && <AddStaffModal />}
      <AnnouncementsModal />
      <AddPropertyModal />
    </div>
  );
}
