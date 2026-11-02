"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ArrowLeft,
  Edit3,
  Loader2,
  ChevronDown,
  Check,
  Save,
  Bed,
} from "lucide-react";
import { useUiStore } from "@/lib/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FACILITY_OPTIONS = [
  "Attached Bathroom",
  "Air Conditioner",
  "High-speed WiFi",
  "Balcony",
  "Cupboard",
  "Geyser",
  "Television",
  "Refrigerator",
  "Study Desk & Chair",
  "Power Backup",
  "Daily Housekeeping",
];

export default function EditRoomModal() {
  const { isEditRoomOpen, selectedRoomForEdit, setEditRoomOpen } = useUiStore();
  const queryClient = useQueryClient();

  const [roomName, setRoomName] = useState("");
  const [floor, setFloor] = useState("Ground Floor");
  const [unitType, setUnitType] = useState("Room");
  const [sharingType, setSharingType] = useState("DOUBLE");
  const [amountPerBed, setAmountPerBed] = useState("12000");
  const [remarks, setRemarks] = useState("");
  const [isAvailableToRent, setIsAvailableToRent] = useState<"yes" | "no">("yes");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [isFacilitiesOpen, setIsFacilitiesOpen] = useState(true);

  useEffect(() => {
    if (selectedRoomForEdit) {
      setRoomName(selectedRoomForEdit.roomNumber || "");
      setFloor(selectedRoomForEdit.floor || "Ground Floor");
      setUnitType(selectedRoomForEdit.unitType || "Room");
      setSharingType(selectedRoomForEdit.sharingType || "DOUBLE");
      setAmountPerBed(
        selectedRoomForEdit.rentAmount
          ? String(Math.round(selectedRoomForEdit.rentAmount / 100))
          : "12000"
      );
      setRemarks(selectedRoomForEdit.remarks || "");
      setIsAvailableToRent(
        selectedRoomForEdit.isDisabledForRent ? "no" : "yes"
      );
      setSelectedFacilities(selectedRoomForEdit.amenities || []);
    }
  }, [selectedRoomForEdit]);

  const updateRoomMutation = useMutation({
    mutationFn: async () => {
      const rentInPaise = Math.round(parseFloat(amountPerBed || "0") * 100);
      return api.rooms.update(selectedRoomForEdit.id, {
        roomNumber: roomName.trim(),
        floor,
        unitType,
        gender: "UNISEX",
        sharingType,
        rentAmount: rentInPaise,
        remarks: remarks.trim() || null,
        amenities: selectedFacilities,
        isDisabledForRent: isAvailableToRent === "no",
      });
    },
    onSuccess: () => {
      toast.success(`Room ${roomName} updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
      closeDrawer();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update room");
    },
  });

  const closeDrawer = () => {
    setEditRoomOpen(false);
  };

  if (!isEditRoomOpen || !selectedRoomForEdit) return null;

  const toggleFacility = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility)
        ? prev.filter((f) => f !== facility)
        : [...prev, facility]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      toast.error("Please enter a room name / number");
      return;
    }
    updateRoomMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
        onClick={closeDrawer}
      />

      {/* Right-Side Slide-Over Drawer matching Image 2 */}
      <div className="fixed inset-y-0 right-0 z-50 flex max-w-full">
        <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeDrawer}
                className="p-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                title="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Edit Room {selectedRoomForEdit.roomNumber}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-4 overflow-y-auto flex-1 text-xs"
          >
            {/* 1. Property */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Property <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value="Vanalilka"
                readOnly
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-800 bg-slate-50/60 cursor-default"
              />
            </div>

            {/* 2. Room Name * */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Room Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Ex. Room 001"
                required
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2F54EB]"
              />
            </div>

            {/* 3. Row: Unit Type * & Select Floor * */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Unit Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2F54EB] appearance-none"
                  >
                    <option value="Room">Room</option>
                    <option value="Flat | 1RK">Flat | 1RK</option>
                    <option value="Flat | 1BHK">Flat | 1BHK</option>
                    <option value="Studio Apartment">Studio Apartment</option>
                    <option value="Villa Suite">Villa Suite</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Floor <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2F54EB] appearance-none"
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="4th Floor">4th Floor</option>
                    <option value="Basement">Basement</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* 4. Row: Sharing Type * & Amount Per Bed */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sharing Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={sharingType}
                    onChange={(e) => setSharingType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2F54EB] appearance-none"
                  >
                    <option value="SINGLE">Single (1 Bed)</option>
                    <option value="DOUBLE">2-Sharing (Double)</option>
                    <option value="TRIPLE">3-Sharing (Triple)</option>
                    <option value="FOUR_SHARING">4-Sharing</option>
                    <option value="FIVE_SHARING">5-Sharing</option>
                    <option value="SIX_SHARING">6-Sharing</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Amount Per Bed
                </label>
                <input
                  type="number"
                  value={amountPerBed}
                  onChange={(e) => setAmountPerBed(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2F54EB]"
                />
              </div>
            </div>

            {/* 5. Room Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Room Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Remarks"
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2F54EB]"
              />
            </div>

            {/* 6. Is this room available to rent * */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Is this room available to rent <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="editIsAvailableToRent"
                    value="yes"
                    checked={isAvailableToRent === "yes"}
                    onChange={() => setIsAvailableToRent("yes")}
                    className="h-4 w-4 text-[#2F54EB] focus:ring-[#2F54EB]"
                  />
                  <span className="text-xs font-semibold text-slate-800">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="editIsAvailableToRent"
                    value="no"
                    checked={isAvailableToRent === "no"}
                    onChange={() => setIsAvailableToRent("no")}
                    className="h-4 w-4 text-[#2F54EB] focus:ring-[#2F54EB]"
                  />
                  <span className="text-xs font-semibold text-slate-800">No</span>
                </label>
              </div>
            </div>

            {/* 7. Room Facilities */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setIsFacilitiesOpen(!isFacilitiesOpen)}
                className="text-xs font-bold text-[#2F54EB] hover:text-blue-700 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Room Facilities</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    isFacilitiesOpen ? "rotate-180" : ""
                  )}
                />
              </button>

              {isFacilitiesOpen && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {FACILITY_OPTIONS.map((facility) => {
                    const isSelected = selectedFacilities.includes(facility);
                    return (
                      <button
                        key={facility}
                        type="button"
                        onClick={() => toggleFacility(facility)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer select-none",
                          isSelected
                            ? "bg-blue-50 text-[#2F54EB] border-blue-300 shadow-2xs font-bold"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {facility}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={updateRoomMutation.isPending}
                className="w-full py-3.5 rounded-2xl bg-[#2F54EB] hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {updateRoomMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
