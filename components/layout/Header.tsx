"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  Bell,
  Command,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { api, authStorage, authActions, type UserProfile } from "@/lib/api/client";

export default function Header() {
  const { selectedPropertyId, activePropertyName } = usePropertyStore();
  const {
    setSearchOpen,
    setPropertySelectorOpen,
    isPropertySelectorOpen,
  } = useUiStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setCurrentUser(authStorage.getUser());
  }, []);

  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => api.properties.list(),
  });

  const properties = propertiesData?.data || [];
  const activeProperty = properties.find((p) => p.id === selectedPropertyId);

  // Keyboard shortcut for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSearchOpen]);

  return (
    <header className="app-header sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b px-3 sm:px-4 lg:px-6 text-white shadow-md">
      {/* Left: Brand & Property Switcher */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 group transition-transform active:scale-95"
          aria-label="PgInfo home"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25">
            <svg
              className="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        </Link>

        {/* Property Selector Trigger Button */}
        <button
          onClick={() => setPropertySelectorOpen(true)}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isPropertySelectorOpen}
          aria-controls="property-selector-dialog"
          className="flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-2 transition text-left cursor-pointer group hover:bg-white/10"
        >
          <span className="max-w-[30vw] truncate text-sm font-semibold text-white sm:max-w-60">
            {activeProperty?.name ||
              (properties.length === 0
                ? "No Properties"
                : activePropertyName || "All Properties")}
          </span>
          <div className="h-6 w-6 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-slate-100 group-hover:bg-white/25 transition">
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </button>
      </div>

      {/* Center: Global Search Bar (⌘K) */}
      <div className="hidden md:flex flex-1 max-w-xl mx-6">
        <button
          onClick={() => setSearchOpen(true)}
          className="relative w-full flex items-center justify-between rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-transparent hover:border-slate-700 px-4 py-2 text-sm text-slate-400 shadow-inner transition cursor-pointer group"
          style={{
            background:
              "linear-gradient(#0c112b, #0c112b) padding-box, linear-gradient(90deg, #3b82f6, #ec4899, #8b5cf6) border-box",
            border: "1px solid transparent",
          }}
        >
          <div className="flex items-center gap-2.5">
            <Search className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition" />
            <span className="text-slate-300">Search Anything</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-700/60">
            <Command className="h-3 w-3" /> K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Actions, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/60 text-slate-300 hover:bg-slate-800 transition"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Keyboard shortcut icon */}
        <button
          onClick={() => setSearchOpen(true)}
          title="Command Palette"
          className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 transition"
        >
          <kbd className="text-xs font-mono">⌘</kbd>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 transition"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          </button>
        </div>

        {/* User Profile Avatar with Interactive Dropdown */}
        <div className="relative pl-1 border-l border-slate-800">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-xl p-1 hover:bg-slate-800/60 transition cursor-pointer"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 p-[2px] shadow">
              <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-amber-400 overflow-hidden">
                <span>
                  {currentUser?.firstName
                    ? `${currentUser.firstName[0]}${currentUser.lastName?.[0] || ""}`
                    : "AS"}
                </span>
              </div>
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200">
                {currentUser?.firstName
                  ? `${currentUser.firstName} ${currentUser.lastName || ""}`
                  : "Asha Sharma"}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">
                {currentUser?.activeOrganizationRole || "Owner"}
              </span>
            </div>
            <ChevronDown className="hidden xl:block h-3 w-3 text-slate-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700/80 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-semibold text-slate-200">
                    {currentUser?.firstName
                      ? `${currentUser.firstName} ${currentUser.lastName || ""}`
                      : "Asha Sharma"}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {currentUser?.email || "Account"}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    <SettingsIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span>Account & Settings</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileOpen(false);
                      authActions.logout();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
