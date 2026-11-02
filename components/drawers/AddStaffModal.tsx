"use client";

import React, { useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import { useUiStore, usePropertyStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function AddStaffModal() {
  const { isAddStaffOpen, setAddStaffOpen } = useUiStore();
  const { selectedPropertyId } = usePropertyStore();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [salary, setSalary] = useState("20000");
  const [designationId, setDesignationId] = useState("");
  const [addAllProperties, setAddAllProperties] = useState(true);

  const { data: designations } = useQuery({
    queryKey: ["staffDesignations"],
    queryFn: () => api.staff.listDesignations(),
    enabled: isAddStaffOpen,
  });

  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => api.properties.list(),
    enabled: isAddStaffOpen,
  });

  const properties = propertiesData?.data || [];
  const propertyId = selectedPropertyId || (properties[0]?.id ?? "");

  const addStaffMutation = useMutation({
    mutationFn: async () => {
      const salaryPaise = Math.round(parseFloat(salary) * 100);
      return api.staff.create({
        propertyId,
        designationId: designationId || (designations?.[0]?.id ?? ""),
        firstName,
        lastName,
        mobile,
        email: email || undefined,
        salary: salaryPaise,
        joiningDate: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      toast.success(`Staff member ${firstName} added successfully!`);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      closeDrawer();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add staff member");
    },
  });

  const closeDrawer = () => {
    setAddStaffOpen(false);
    setFirstName("");
    setLastName("");
    setMobile("");
    setEmail("");
  };

  if (!isAddStaffOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    addStaffMutation.mutate();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={closeDrawer}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between text-slate-800 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <UserPlus className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Add Team Member</h2>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between p-5 overflow-y-auto">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Ramesh"
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-medium"
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
                  placeholder="e.g. Kulkarni"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number (10 Digits)
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="9876543210"
                required
                maxLength={10}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@example.com"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation / Role
                </label>
                <select
                  value={designationId}
                  onChange={(e) => setDesignationId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white"
                >
                  {designations?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly Salary (₹)
                </label>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="25000"
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <input
                  type="checkbox"
                  checked={addAllProperties}
                  onChange={(e) => setAddAllProperties(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Assign this member to all properties in organization
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={closeDrawer}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addStaffMutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {addStaffMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span>Add Member</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
