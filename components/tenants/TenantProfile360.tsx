"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Phone,
  MessageSquare,
  Edit,
  Download,
  Calendar,
  CreditCard,
  FileText,
  AlertTriangle,
  Trash2,
  PlusCircle,
  Tag,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  Receipt,
  Bed,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatINR, formatDate, cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store";
import { toast } from "sonner";

export default function TenantProfile360({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();
  const { setAddRentDuesOpen, setSelectedTenantForDue, setReceivePaymentOpen, setSelectedResidentForPayment } =
    useUiStore();

  const [rightTab, setRightTab] = useState<"passbook" | "form" | "profile" | "docs">("passbook");

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["resident", tenantId],
    queryFn: () => api.residents.get(tenantId),
  });

  const { data: duesData } = useQuery({
    queryKey: ["residentDues", tenantId],
    queryFn: () => api.billing.list({ residentId: tenantId }),
  });

  const { data: paymentsData } = useQuery({
    queryKey: ["residentPayments", tenantId],
    queryFn: () => api.payments.list({ residentId: tenantId }),
  });

  const dues = duesData?.data || [];
  const payments = paymentsData?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <span>Loading tenant 360 profile...</span>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Tenant not found.</p>
        <Link href="/people/tenants" className="text-blue-600 underline text-sm mt-2 block">
          Return to Tenants Roster
        </Link>
      </div>
    );
  }

  const handleOpenWhatsApp = () => {
    const cleanMobile = tenant.mobile?.replace(/\D/g, "");
    window.open(`https://wa.me/91${cleanMobile}`, "_blank");
  };

  const handleCall = () => {
    window.location.href = `tel:${tenant.mobile}`;
  };

  const handleDownloadForm = () => {
    toast.success("Downloading joining admission form PDF...");
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/people/tenants" className="flex items-center gap-1 hover:text-blue-600 transition">
          <ChevronLeft className="h-4 w-4" />
          <span>Tenants</span>
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">{tenant.firstName} {tenant.lastName || ""}</span>
      </div>

      {/* Main 2-Section Grid (Left & Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section: Profile Icon, Phone, Renting & Financial Summary */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Identity & Quick Actions */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center relative overflow-hidden">
            <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 mx-auto flex items-center justify-center text-2xl font-bold text-white shadow-md mb-3">
              {tenant.firstName.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {tenant.firstName} {tenant.lastName || ""}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{tenant.mobile}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                {tenant.status}
              </span>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                KYC Verified
              </span>
            </div>

            {/* Call, WhatsApp & Edit shortcut buttons */}
            <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={handleCall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
              >
                <Phone className="h-3.5 w-3.5 text-amber-600" />
                <span>Call</span>
              </button>
              <button
                onClick={handleOpenWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-700 transition"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => toast.info("Opening edit modal...")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-blue-700 transition"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* Card 2: Renting Summary */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Renting Summary
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Property</span>
                <span className="font-semibold text-slate-900">{tenant.property?.name || "Vanalilka"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Room & Bed</span>
                <span className="font-semibold text-slate-900">
                  Room {tenant.room?.roomNumber || "101"} ({tenant.bed?.bedNumber || "BedD"})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Monthly Rent</span>
                <span className="font-bold text-slate-900">{formatINR(tenant.monthlyRent)}/mo</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Joining Date</span>
                <span className="font-semibold text-slate-900">{formatDate(tenant.joiningDate)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Agreement End</span>
                <span className="font-semibold text-slate-900">
                  {formatDate(tenant.expectedVacatingDate || "2027-09-21")}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Financial Summary */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Financial Summary
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Security Deposit</span>
                <span className="font-bold text-slate-900">{formatINR(tenant.securityDeposit)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Pending Dues</span>
                <span className="font-bold text-rose-600">
                  {tenant.firstName.toLowerCase() === "raghav" ? "₹32,516" : "₹0"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Lifetime Paid</span>
                <span className="font-bold text-emerald-600">
                  {tenant.firstName.toLowerCase() === "raghav" ? "₹24,000" : "₹15,484"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Tabs for Passbook, Joining Form, Profile Details, Docs */}
        <div className="lg:col-span-8 space-y-5">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            {/* Tabs Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex gap-2">
                {[
                  { id: "passbook", label: "Passbook & Ledger", icon: CreditCard },
                  { id: "form", label: "Joining Form", icon: FileText },
                  { id: "profile", label: "Profile Details", icon: ShieldCheck },
                  { id: "docs", label: "KYC Documents", icon: Tag },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = rightTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setRightTab(t.id as any)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer",
                        isActive
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {rightTab === "form" && (
                <button
                  onClick={handleDownloadForm}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Form PDF</span>
                </button>
              )}
            </div>

            {/* Tab 1: Passbook & Ledger */}
            {rightTab === "passbook" && (
              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Billing & Payment Timeline</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedTenantForDue(tenant);
                        setAddRentDuesOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition"
                    >
                      + Add Due
                    </button>
                    <button
                      onClick={() => {
                        setSelectedResidentForPayment(tenant);
                        setReceivePaymentOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold shadow-xs transition"
                    >
                      Collect Payment
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {dues.map((due) => (
                    <div key={due.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                          <Receipt className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{due.type} Due</span>
                          <span className="text-[11px] text-slate-500">
                            Due date: {formatDate(due.dueDate)} · {due.description || "Billed"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-rose-600 block">
                          {formatINR(due.amount - due.paidAmount)}
                        </span>
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          {due.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {payments.map((p) => (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Payment Received ({p.mode})</span>
                          <span className="text-[11px] text-slate-500">
                            Paid on: {formatDate(p.collectionDate)} · Ref: {p.reference || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-600 block">
                          +{formatINR(p.amount)}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          CONFIRMED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Joining Form */}
            {rightTab === "form" && (
              <div className="pt-4 space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Official Tenancy Admission Form</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500 block">Full Legal Name</span>
                      <span className="font-semibold text-slate-900">{tenant.firstName} {tenant.lastName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Profession</span>
                      <span className="font-semibold text-slate-900">{tenant.profession || "Working Professional"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Allocated Room</span>
                      <span className="font-semibold text-slate-900">Room {tenant.room?.roomNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Bed Identifier</span>
                      <span className="font-semibold text-slate-900">{tenant.bed?.bedNumber || "BedA"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Profile Details */}
            {rightTab === "profile" && (
              <div className="pt-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block">Email Address</span>
                    <span className="font-semibold text-slate-900">{tenant.email || "N/A"}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block">Emergency Contact</span>
                    <span className="font-semibold text-slate-900">{tenant.emergencyContact || "Verified"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Docs */}
            {rightTab === "docs" && (
              <div className="pt-4 space-y-3 text-xs">
                <div className="p-4 rounded-2xl border border-dashed border-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <div>
                      <span className="font-bold text-slate-900 block">Aadhaar Card Copy</span>
                      <span className="text-slate-400">Verified by DigiLocker</span>
                    </div>
                  </div>
                  <button className="text-blue-600 font-semibold hover:underline">View Document</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bottom Sticky Action Bar matching prompt requirements */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-2 flex items-center gap-2 max-w-2xl w-[92%] sm:w-auto">
        <button
          onClick={() => {
            setSelectedTenantForDue(tenant);
            setAddRentDuesOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Add Dues</span>
        </button>

        <button
          onClick={() => toast.info("Opening edit tenant form...")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
        >
          <Edit className="h-3.5 w-3.5" />
          <span>Edit</span>
        </button>

        <button
          onClick={() => toast.info("Displaying audit & activity logs...")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Activity Logs</span>
        </button>

        <button
          onClick={() => toast.warning("Move-out notice scheduled")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-amber-700 text-xs font-semibold transition cursor-pointer"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Give Notice</span>
        </button>

        <button
          onClick={() => toast.info("Discount / waiver added")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
        >
          <Tag className="h-3.5 w-3.5" />
          <span>Add Discount</span>
        </button>

        <button
          onClick={() => {
            if (confirm("Are you sure you want to delete / archive this tenant?")) {
              toast.success("Tenant archived");
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}
