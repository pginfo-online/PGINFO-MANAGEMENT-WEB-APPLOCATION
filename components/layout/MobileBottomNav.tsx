"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Wallet,
  Grid,
  Users,
  Building2,
  X,
  PlusCircle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isAllSheetOpen, setIsAllSheetOpen] = useState(false);
  const { setAddRentDuesOpen, setReceivePaymentOpen, setAddExpenseOpen } =
    useUiStore();

  const tabs = [
    { title: "Home", href: "/", icon: Home },
    { title: "Money", href: "/money/dues", icon: Wallet },
    {
      title: "All",
      isAction: true,
      onClick: () => setIsAllSheetOpen(!isAllSheetOpen),
      icon: Grid,
    },
    { title: "People", href: "/people/tenants", icon: Users },
    { title: "Property", href: "/property/rooms", icon: Building2 },
  ];

  return (
    <>
      {/* Quick "All" Action Sheet Modal for Mobile */}
      {isAllSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 text-white max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-semibold text-base">All Modules & Shortcuts</h3>
              <button
                onClick={() => setIsAllSheetOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 py-4">
              <button
                onClick={() => {
                  setIsAllSheetOpen(false);
                  setReceivePaymentOpen(true);
                }}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20"
              >
                <Zap className="h-6 w-6 mb-1 text-blue-400" />
                <span className="text-xs font-medium">Receive Pay</span>
              </button>
              <button
                onClick={() => {
                  setIsAllSheetOpen(false);
                  setAddRentDuesOpen(true);
                }}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-600/10 border border-amber-500/20 text-amber-400 hover:bg-amber-600/20"
              >
                <PlusCircle className="h-6 w-6 mb-1 text-amber-400" />
                <span className="text-xs font-medium">Add Due</span>
              </button>
              <button
                onClick={() => {
                  setIsAllSheetOpen(false);
                  setAddExpenseOpen(true);
                }}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600/20"
              >
                <Wallet className="h-6 w-6 mb-1 text-rose-400" />
                <span className="text-xs font-medium">Expense</span>
              </button>
            </div>

            <div className="space-y-1 text-sm font-medium">
              <Link
                href="/analytics"
                onClick={() => setIsAllSheetOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 text-slate-300"
              >
                <span>Analytics & BI Center</span>
                <span className="text-xs text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded">
                  Beta
                </span>
              </Link>
              <Link
                href="/people/bookings"
                onClick={() => setIsAllSheetOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 text-slate-300"
              >
                <span>Reservations & Bookings</span>
              </Link>
              <Link
                href="/property/complaints"
                onClick={() => setIsAllSheetOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 text-slate-300"
              >
                <span>Helpdesk Tickets</span>
              </Link>
              <Link
                href="/property/meters"
                onClick={() => setIsAllSheetOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 text-slate-300"
              >
                <span>Electric Meters</span>
              </Link>
              <Link
                href="/reports"
                onClick={() => setIsAllSheetOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 text-slate-300"
              >
                <span>Reports & CSV Downloads</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsAllSheetOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 text-slate-300"
              >
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 5 Primary Bottom Navigation Bar */}
      <nav className="app-bottom-nav fixed bottom-0 left-0 right-0 z-40 lg:hidden flex h-16 items-center justify-around border-t px-2 text-slate-400 shadow-2xl backdrop-blur-md">
        {tabs.map((tab) => {
          const isActive = tab.href ? pathname === tab.href : false;
          const Icon = tab.icon;

          if (tab.isAction) {
            return (
              <button
                key={tab.title}
                onClick={tab.onClick}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition active:scale-95",
                  isAllSheetOpen ? "text-blue-400" : "text-slate-400"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl",
                    isAllSheetOpen ? "bg-blue-600 text-white" : "bg-slate-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-medium mt-1">{tab.title}</span>
              </button>
            );
          }

          return (
            <Link
              key={tab.title}
              href={tab.href!}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 transition active:scale-95",
                isActive ? "text-blue-400 font-semibold" : "hover:text-slate-200"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 mb-1 transition",
                  isActive ? "text-blue-400" : "text-slate-400"
                )}
              />
              <span className="text-[10px]">{tab.title}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
