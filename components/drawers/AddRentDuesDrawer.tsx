"use client";

import React, { useState } from "react";
import {
  X,
  Search,
  Building,
  Users,
  Check,
  Receipt,
  Plus,
  Loader2,
} from "lucide-react";
import { useUiStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { cn, formatINR } from "@/lib/utils";
import { toast } from "sonner";

export default function AddRentDuesDrawer() {
  const { isAddRentDuesOpen, setAddRentDuesOpen, selectedTenantForDue, setSelectedTenantForDue } =
    useUiStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"Rooms" | "Tenants">("Tenants");
  const [search, setSearch] = useState("");
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);

  // Modal / Form state for entering amount
  const [isFormStep, setIsFormStep] = useState(false);
  const [targetResident, setTargetResident] = useState<any | null>(null);
  const [dueType, setDueType] = useState("RENT");
  const [dueAmount, setDueAmount] = useState("12000");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("Monthly Rent");

  // Automatically activate form step when a tenant is selected from table
  React.useEffect(() => {
    if (selectedTenantForDue) {
      setTargetResident(selectedTenantForDue);
      setDueAmount(
        selectedTenantForDue.monthlyRent
          ? String(selectedTenantForDue.monthlyRent / 100)
          : "12000"
      );
      setDueType("RENT");
      setDueDate(new Date().toISOString().slice(0, 10));
      setDescription("Monthly Rent");
      setIsFormStep(true);
    }
  }, [selectedTenantForDue]);

  const { data: residentsData } = useQuery({
    queryKey: ["residents"],
    queryFn: () => api.residents.list({ limit: 100 }),
    enabled: isAddRentDuesOpen,
  });

  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => api.properties.list(),
    enabled: isAddRentDuesOpen,
  });

  const residents = residentsData?.data || [];
  const properties = propertiesData?.data || [];

  const addChargeMutation = useMutation({
    mutationFn: async (data: {
      residentId: string;
      type: string;
      amount: number;
      dueDate: string;
      description?: string;
    }) => {
      return api.billing.createCharge(data);
    },
    onSuccess: () => {
      toast.success("Rent due added successfully!");
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      queryClient.invalidateQueries({ queryKey: ["residents"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
      closeDrawer();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add rent due");
    },
  });

  const closeDrawer = () => {
    setAddRentDuesOpen(false);
    setSelectedTenantForDue(null);
    setIsFormStep(false);
    setTargetResident(null);
    setSelectedTenantIds([]);
  };

  const handleOpenFormForResident = (resident: any) => {
    setTargetResident(resident);
    setDueAmount(resident.monthlyRent ? String(resident.monthlyRent / 100) : "12000");
    setIsFormStep(true);
  };

  const handleBatchSubmit = async () => {
    if (selectedTenantIds.length === 0 && residents.length > 0) {
      // Apply for all
      toast.info(`Generating dues for all ${residents.length} tenants...`);
      for (const res of residents) {
        await api.billing.createCharge({
          residentId: res.id,
          type: "RENT",
          amount: res.monthlyRent || 1200000,
          dueDate,
          description: "Monthly Rent Auto Due",
        });
      }
      toast.success(`Dues generated for all ${residents.length} tenants!`);
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      queryClient.invalidateQueries({ queryKey: ["residents"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      closeDrawer();
      return;
    }

    // Apply for selected
    for (const id of selectedTenantIds) {
      const res = residents.find((r) => r.id === id);
      await api.billing.createCharge({
        residentId: id,
        type: dueType,
        amount: parseInt(dueAmount, 10) * 100,
        dueDate: dueDate || new Date().toISOString().slice(0, 10),
        description: description?.trim() || "Monthly Rent",
      });
    }
    toast.success("Dues created for selected tenants!");
    queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
    queryClient.invalidateQueries({ queryKey: ["billing"] });
    queryClient.invalidateQueries({ queryKey: ["residents"] });
    queryClient.invalidateQueries({ queryKey: ["properties"] });
    closeDrawer();
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetResident) return;
    const amountInPaise = Math.round(parseFloat(dueAmount) * 100);
    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    addChargeMutation.mutate({
      residentId: targetResident.id,
      type: dueType,
      amount: amountInPaise,
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      description: description?.trim() || "Monthly Rent",
    });
  };

  if (!isAddRentDuesOpen) return null;

  const filteredResidents = residents.filter(
    (r) =>
      r.firstName.toLowerCase().includes(search.toLowerCase()) ||
      (r.lastName && r.lastName.toLowerCase().includes(search.toLowerCase())) ||
      r.mobile.includes(search)
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={closeDrawer}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between text-slate-800 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Add Rent Dues</h2>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {!isFormStep ? (
          <>
            {/* Tabs (Rooms vs Tenants) */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setActiveTab("Rooms")}
                className={cn(
                  "flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition cursor-pointer",
                  activeTab === "Rooms"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                <Building className="h-4 w-4" />
                <span>Rooms (3 Rooms)</span>
              </button>
              <button
                onClick={() => setActiveTab("Tenants")}
                className={cn(
                  "flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition cursor-pointer",
                  activeTab === "Tenants"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                <Users className="h-4 w-4" />
                <span>Tenants ({residents.length} Tenants)</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type to search contact..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => {
                    if (selectedTenantIds.length === residents.length) {
                      setSelectedTenantIds([]);
                    } else {
                      setSelectedTenantIds(residents.map((r) => r.id));
                    }
                  }}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 border border-slate-200 rounded-xl px-3 py-1.5 transition cursor-pointer"
                >
                  <div
                    className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center",
                      selectedTenantIds.length === residents.length
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-slate-300"
                    )}
                  >
                    {selectedTenantIds.length === residents.length && (
                      <Check className="h-3 w-3 stroke-[3]" />
                    )}
                  </div>
                  <span>Select Multiple</span>
                </button>
              </div>
            </div>

            {/* List of Tenants / Rooms */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredResidents.map((r) => {
                const isChecked = selectedTenantIds.includes(r.id);
                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-xs transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => {
                          setSelectedTenantIds((prev) =>
                            prev.includes(r.id)
                              ? prev.filter((id) => id !== r.id)
                              : [...prev, r.id]
                          );
                        }}
                        className={cn(
                          "h-5 w-5 rounded-md border flex items-center justify-center cursor-pointer transition",
                          isChecked
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-slate-300 hover:border-blue-400"
                        )}
                      >
                        {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {r.firstName} {r.lastName || ""}
                          </span>
                          <span className="bg-emerald-50 text-emerald-600 font-bold text-[10px] px-1.5 py-0.5 rounded">
                            {r.status}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>🏠</span> {r.room?.roomNumber || "101"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenFormForResident(r)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      Add Dues
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Button */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <button
                onClick={handleBatchSubmit}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {selectedTenantIds.length > 0
                    ? `Add Dues for ${selectedTenantIds.length} Selected Tenants`
                    : `Add Dues for all ${residents.length} Tenants`}
                </span>
                <span>&gt;</span>
              </button>
            </div>
          </>
        ) : (
          /* Form Step: Enter details for single resident */
          <form onSubmit={handleSingleSubmit} className="flex-1 flex flex-col justify-between p-5">
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-blue-600 font-semibold uppercase">
                    Adding Due For
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {targetResident?.firstName} {targetResident?.lastName}
                  </p>
                  <p className="text-xs text-slate-500">
                    Room {targetResident?.room?.roomNumber} · {targetResident?.mobile}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormStep(false)}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Due Category
                </label>
                <select
                  value={dueType}
                  onChange={(e) => setDueType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RENT">Rent</option>
                  <option value="ELECTRICITY">Electricity</option>
                  <option value="SECURITY_DEPOSIT">Security Deposit</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="WATER">Water</option>
                  <option value="LATE_FEE">Late Fee / Penalty</option>
                  <option value="OTHER">Other Charges</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={dueAmount}
                  onChange={(e) => setDueAmount(e.target.value)}
                  required
                  min="1"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Remarks
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. November Monthly Rent"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFormStep(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={addChargeMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {addChargeMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <span>Confirm & Add Due</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
