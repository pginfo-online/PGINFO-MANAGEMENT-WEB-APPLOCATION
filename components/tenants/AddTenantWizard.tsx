"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Bed,
  Calendar,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { usePropertyStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatINR, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AddTenantWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPropertyId = searchParams.get("propertyId");
  const preSelectedRoomId = searchParams.get("roomId");
  const preSelectedBedId = searchParams.get("bedId");
  const preSelectedBedNumber = searchParams.get("bedNumber");
  const queryClient = useQueryClient();

  const { selectedPropertyId } = usePropertyStore();

  const [step, setStep] = useState(1);

  // Step 1: Personal Details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("MALE");
  const [profession, setProfession] = useState("WORKING_PROFESSIONAL");

  // Step 2: Room & Bed Allocation
  const [propertyId, setPropertyId] = useState(preSelectedPropertyId || "");
  const [roomId, setRoomId] = useState(preSelectedRoomId || "");
  const [bedId, setBedId] = useState(preSelectedBedId || "");
  const [monthlyRent, setMonthlyRent] = useState("12000");

  // Step 3: Tenancy Duration
  const [joiningDate, setJoiningDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [lockInMonths, setLockInMonths] = useState(6);
  const [noticeDays, setNoticeDays] = useState(30);
  const [rentCycleDay, setRentCycleDay] = useState(1);
  const [securityDeposit, setSecurityDeposit] = useState("24000");

  // Step 4: Initial Due Schedule Matrix
  const [initialCollectionMode, setInitialCollectionMode] = useState<"UPI" | "CASH" | "PENDING">("UPI");
  const [initialPaymentCollected, setInitialPaymentCollected] = useState(true);

  // Load properties
  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => api.properties.list(),
  });
  const properties = propertiesData?.data || [];

  useEffect(() => {
    if (!propertyId && properties.length > 0) {
      setPropertyId(selectedPropertyId || properties[0].id);
    }
  }, [properties, selectedPropertyId, propertyId]);

  // Load rooms for property
  const { data: rooms } = useQuery({
    queryKey: ["rooms", propertyId],
    queryFn: () => (propertyId ? api.rooms.listByProperty(propertyId) : []),
    enabled: !!propertyId,
  });

  const roomList = rooms || [];

  useEffect(() => {
    if (!roomId && roomList.length > 0) {
      setRoomId(roomList[0].id);
    }
  }, [roomList, roomId]);

  const selectedRoom = roomList.find((r) => r.id === roomId);
  const beds = selectedRoom?.beds || [];
  const vacantBeds = beds.filter((b: any) => b.status === "AVAILABLE");

  useEffect(() => {
    if (preSelectedBedId) {
      setBedId(preSelectedBedId);
    } else if (vacantBeds.length > 0 && !bedId) {
      setBedId(vacantBeds[0].id);
    }
    if (selectedRoom?.rentAmount) {
      setMonthlyRent(String(selectedRoom.rentAmount / 100));
    }
  }, [preSelectedBedId, vacantBeds, bedId, selectedRoom]);

  // Pro-rata rent calculation
  // Formula: Round(Monthly Rent * (Days Remaining in Month / Total Days in Month))
  const calculateProRata = () => {
    const rentNum = parseFloat(monthlyRent) || 0;
    const dateObj = new Date(joiningDate);
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    if (day === 1) return rentNum;
    const remainingDays = totalDaysInMonth - day + 1;
    return Math.round((rentNum * remainingDays) / totalDaysInMonth);
  };

  const proRataRent = calculateProRata();
  const depositNum = parseFloat(securityDeposit) || 0;
  const totalInitialDue = proRataRent + depositNum;

  // Mutation
  const createResidentMutation = useMutation({
    mutationFn: async () => {
      const rentInPaise = Math.round(parseFloat(monthlyRent) * 100);
      const depositInPaise = Math.round(depositNum * 100);

      const resident = await api.residents.create({
        propertyId,
        roomId: roomId || undefined,
        bedId: bedId || undefined,
        firstName,
        lastName: lastName || undefined,
        mobile,
        email: email || undefined,
        profession,
        monthlyRent: rentInPaise,
        securityDeposit: depositInPaise,
        joiningDate,
      });

      // If initial payment was collected, record it
      if (initialPaymentCollected && resident?.id) {
        await api.payments.record({
          residentId: resident.id,
          amount: totalInitialDue * 100,
          mode: initialCollectionMode === "PENDING" ? "CASH" : initialCollectionMode,
          collectionDate: joiningDate,
          notes: "Initial Token + Pro-Rata Rent & Security Deposit",
        });
      }

      return resident;
    },
    onSuccess: (res) => {
      toast.success(`Resident ${firstName} successfully onboarded!`);
      queryClient.invalidateQueries({ queryKey: ["residents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      router.push("/people/tenants");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to onboard resident");
    },
  });

  const handleNextStep = () => {
    if (step === 1) {
      if (!firstName.trim() || mobile.length < 10) {
        toast.error("Please provide tenant full name and a valid 10-digit mobile number");
        return;
      }
    }
    if (step === 2) {
      if (!roomId) {
        toast.error("Please select a room");
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createResidentMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/people/tenants" className="hover:text-blue-600 transition">
          Tenants
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">New Tenant Onboarding</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Tenant</h1>
          <p className="text-xs text-slate-500 mt-1">
            Allocate room inventory, configure tenancy agreement terms, and schedule initial dues
          </p>
        </div>
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, label: "Personal Details" },
          { num: 2, label: "Room & Bed" },
          { num: 3, label: "Duration & Rent" },
          { num: 4, label: "Due Schedule" },
        ].map((s) => {
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          return (
            <div
              key={s.num}
              onClick={() => {
                if (isDone) setStep(s.num);
              }}
              className={cn(
                "p-3 rounded-2xl border transition text-center cursor-pointer",
                isCurrent
                  ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-xs"
                  : isDone
                  ? "border-emerald-200 bg-emerald-50/40 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-400"
              )}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <span>Step {s.num}</span>
                )}
              </div>
              <span className="text-[11px] font-medium block truncate mt-0.5">
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Form Container */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
        {/* Pre-allocated Room/Bed Banner matching frame_024 */}
        {preSelectedRoomId && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs">
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-[#2F54EB]" />
              <span>
                Pre-selected Inventory:{" "}
                <strong className="font-bold">
                  Room {selectedRoom?.roomNumber || "101"} -{" "}
                  {preSelectedBedNumber || "Bed"}
                </strong>{" "}
                ({formatINR(selectedRoom?.rentAmount || 1200000)}/mo)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                router.replace("/people/tenants/addTenant");
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
            >
              Change
            </button>
          </div>
        )}

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span>Step 1: Resident Personal Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Vikram"
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Joshi"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (10 Digits) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  required
                  maxLength={10}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="resident@example.com"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profession
                </label>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white"
                >
                  <option value="WORKING_PROFESSIONAL">Working Professional</option>
                  <option value="STUDENT">Student</option>
                  <option value="SELF_EMPLOYED">Self Employed</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Room & Inventory Allocation */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bed className="h-4 w-4 text-blue-600" />
              <span>Step 2: Room & Inventory Allocation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Property
                </label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white font-medium"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Room
                </label>
                <select
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(e.target.value);
                    setBedId("");
                  }}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white font-bold"
                >
                  {roomList.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.floor || "Ground Floor"} - {r.sharingType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Bed (Vacant Only)
                </label>
                <select
                  value={bedId}
                  onChange={(e) => setBedId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white font-bold text-blue-600"
                >
                  {vacantBeds.length === 0 ? (
                    <option value="">No beds currently vacant</option>
                  ) : (
                    vacantBeds.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.bedNumber} (Vacant)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contracted Monthly Rent (₹)
                </label>
                <input
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Tenancy Duration & Rent Structure */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Step 3: Tenancy Duration & Rent Structure</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Joining Date
                </label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Security Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lock-In Period (Months)
                </label>
                <input
                  type="number"
                  value={lockInMonths}
                  onChange={(e) => setLockInMonths(Number(e.target.value))}
                  min="0"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notice Period (Days)
                </label>
                <input
                  type="number"
                  value={noticeDays}
                  onChange={(e) => setNoticeDays(Number(e.target.value))}
                  min="0"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rental Cycle Day
                </label>
                <input
                  type="number"
                  value={rentCycleDay}
                  onChange={(e) => setRentCycleDay(Number(e.target.value))}
                  min="1"
                  max="28"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Initial Due Schedule Matrix matching Section 6.2 Table */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-600" />
              <span>Step 4: Initial Due Schedule Matrix</span>
            </h3>

            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">DUE TYPE</th>
                    <th className="p-3">DUE FOR</th>
                    <th className="p-3">DUE AMOUNT</th>
                    <th className="p-3">COLLECTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="p-3 font-bold text-slate-900">Pro-Rata Rent</td>
                    <td className="p-3 text-slate-500">
                      From {joiningDate} to end of month
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      ₹{proRataRent.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-emerald-600 font-bold">Included</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900">Security Deposit</td>
                    <td className="p-3 text-slate-500">Refundable caution deposit</td>
                    <td className="p-3 font-bold text-slate-900">
                      ₹{depositNum.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-emerald-600 font-bold">Included</td>
                  </tr>
                  <tr className="bg-blue-50/50 font-bold">
                    <td className="p-3" colSpan={2}>
                      Total Move-In Payable
                    </td>
                    <td className="p-3 text-blue-600 text-sm">
                      ₹{totalInitialDue.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3">
                      <select
                        value={initialCollectionMode}
                        onChange={(e) => setInitialCollectionMode(e.target.value as any)}
                        className="rounded-lg border border-slate-300 p-1 text-xs bg-white font-semibold"
                      >
                        <option value="UPI">Pay via UPI</option>
                        <option value="CASH">Pay via Cash</option>
                        <option value="PENDING">Mark as Pending</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={initialPaymentCollected}
                  onChange={(e) => setInitialPaymentCollected(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Record initial token / deposit payment immediately</span>
              </label>
            </div>
          </div>
        )}

        {/* Wizard Footer Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={createResidentMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {createResidentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>Complete Admission</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
