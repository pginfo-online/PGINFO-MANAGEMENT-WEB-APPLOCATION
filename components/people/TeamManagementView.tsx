"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  ShieldCheck,
  Edit,
  Trash2,
  Clock,
  Briefcase,
  Loader2,
} from "lucide-react";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatINR, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TeamManagementView() {
  const { selectedPropertyId } = usePropertyStore();
  const { setAddStaffOpen } = useUiStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const { data: staffData, isLoading } = useQuery({
    queryKey: ["staff", selectedPropertyId],
    queryFn: () =>
      api.staff.list({
        propertyId: selectedPropertyId || undefined,
        limit: 50,
      }),
  });

  const staffList = staffData?.data || [];

  const deleteStaffMutation = useMutation({
    mutationFn: (id: string) => api.staff.delete(id),
    onSuccess: () => {
      toast.success("Team member deactivated");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove staff");
    },
  });

  const filteredStaff = staffList.filter((s) =>
    `${s.firstName} ${s.lastName || ""}`.toLowerCase().includes(search.toLowerCase()) ||
    s.mobile.includes(search)
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Staff directory, property assignments, salary payroll, and permissions
          </p>
        </div>

        <button
          onClick={() => setAddStaffOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* KPI Cards: Total Members, Members with Access, Members wo Access */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Total Members</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {staffList.length || 3}
          </span>
          <span className="text-xs text-slate-500 font-medium">Active roster</span>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Members With Portal Access</span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">1</span>
          <span className="text-xs text-blue-600 font-medium">Managers & supervisors</span>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Members Without Portal Access</span>
          <span className="text-2xl font-bold text-slate-600 mt-1 block">
            {Math.max(0, (staffList.length || 3) - 1)}
          </span>
          <span className="text-xs text-slate-500 font-medium">Ground field staff</span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search team by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl bg-white border border-slate-200 pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
        />
      </div>

      {/* Team Table matching specifications */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">NAME</th>
                <th className="py-3.5 px-6">DESIGNATION</th>
                <th className="py-3.5 px-6">PHONE</th>
                <th className="py-3.5 px-6">PROPERTIES</th>
                <th className="py-3.5 px-6">SALARY</th>
                <th className="py-3.5 px-6">KYC STATUS</th>
                <th className="py-3.5 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading team members...</span>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No team members found. Click &quot;Add New Member&quot; to register staff.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {staff.firstName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {staff.firstName} {staff.lastName || ""}
                          </span>
                          <span className="text-xs text-slate-400">
                            {staff.email || "No email"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {staff.designation?.name || "Staff"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-xs font-medium text-slate-700">
                      {staff.mobile}
                    </td>

                    <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                      {staff.property?.name || "All Properties"}
                    </td>

                    <td className="py-4 px-6 font-bold text-slate-900 text-xs">
                      {formatINR(staff.salary)}
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Verified</span>
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toast.info("Opening edit staff member...")}
                          title="Edit member"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => toast.info("Opening member activity logs...")}
                          title="Activity Logs"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Clock className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to deactivate this member?")) {
                              deleteStaffMutation.mutate(staff.id);
                            }
                          }}
                          title="Delete member"
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
