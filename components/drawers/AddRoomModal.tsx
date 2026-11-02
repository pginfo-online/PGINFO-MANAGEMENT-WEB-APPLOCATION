"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ArrowLeft,
  Bed,
  Loader2,
  ChevronDown,
  Check,
  Plus,
  Trash2,
  Sliders,
} from "lucide-react";
import { useUiStore, usePropertyStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export default function AddRoomModal() {
  const { isAddRoomOpen, setAddRoomOpen } = useUiStore();
  const { selectedPropertyId, activePropertyName } = usePropertyStore();
  const queryClient = useQueryClient();

  // Form state matching Image 2
  const [propertyId, setPropertyId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [unitType, setUnitType] = useState("Room");
  const [floor, setFloor] = useState("Ground Floor");
  const [sharingType, setSharingType] = useState("DOUBLE");
  const [amountPerBed, setAmountPerBed] = useState("12000");
  const [remarks, setRemarks] = useState("");
  const [isAvailableToRent, setIsAvailableToRent] = useState<"yes" | "no">("yes");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([
    "Attached Bathroom",
    "High-speed WiFi",
    "Cupboard",
  ]);
  const [isFacilitiesOpen, setIsFacilitiesOpen] = useState(true);

  // Beds configuration
  const [bedList, setBedList] = useState<{ name: string; rentOverride: string }[]>([
    { name: "BedA", rentOverride: "" },
    { name: "BedB", rentOverride: "" },
  ]);

  // Load properties
  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => api.properties.list(),
    enabled: isAddRoomOpen,
  });

  const properties = propertiesData?.data || [];

  useEffect(() => {
    if (!propertyId && properties.length > 0) {
      setPropertyId(selectedPropertyId || properties[0].id);
    }
  }, [properties, selectedPropertyId, propertyId]);

  const activeProperty =
    properties.find((p) => p.id === propertyId) ||
    properties[0] ||
    null;

  // Handle sharing type change and auto-generate beds
  const handleSharingChange = (newSharing: string) => {
    setSharingType(newSharing);
    let count = 2;
    if (newSharing === "SINGLE") count = 1;
    if (newSharing === "DOUBLE") count = 2;
    if (newSharing === "TRIPLE") count = 3;
    if (newSharing === "FOUR_SHARING") count = 4;
    if (newSharing === "FIVE_SHARING") count = 5;
    if (newSharing === "SIX_SHARING") count = 6;

    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const newBeds = Array.from({ length: count }, (_, i) => ({
      name: `Bed${letters[i] ?? i + 1}`,
      rentOverride: "",
    }));
    setBedList(newBeds);
  };

  const toggleFacility = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility)
        ? prev.filter((f) => f !== facility)
        : [...prev, facility]
    );
  };

  // Create room mutation
  const addRoomMutation = useMutation({
    mutationFn: async () => {
      const rentInPaise = Math.round(parseFloat(amountPerBed || "0") * 100);
      const bedNames = bedList.map((b) => b.name);
      const bedRents: Record<string, number> = {};
      bedList.forEach((b) => {
        if (b.rentOverride && !isNaN(parseFloat(b.rentOverride))) {
          bedRents[b.name] = Math.round(parseFloat(b.rentOverride) * 100);
        }
      });

      const effectivePropertyId =
        propertyId || selectedPropertyId || properties[0]?.id;

      return api.rooms.create(effectivePropertyId, {
        roomNumber: roomName.trim(),
        floor,
        unitType,
        gender: "UNISEX",
        sharingType,
        rentAmount: rentInPaise,
        lockInPeriod: "No Lock-in",
        remarks: remarks.trim() || undefined,
        amenities: selectedFacilities,
        isDisabledForRent: isAvailableToRent === "no",
        isPublished: true,
        initialBedCount: bedList.length,
        bedNames,
        bedRents: Object.keys(bedRents).length > 0 ? bedRents : undefined,
      });
    },
    onSuccess: () => {
      toast.success(
        `Room ${roomName} created with ${bedList.length} beds (${bedList
          .map((b) => b.name)
          .join(", ")})!`
      );
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
      closeDrawer();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create room");
    },
  });

  const closeDrawer = () => {
    setAddRoomOpen(false);
    setRoomName("");
    setRemarks("");
  };

  if (!isAddRoomOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      toast.error("Please enter a room name / number");
      return;
    }
    addRoomMutation.mutate();
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
          {/* Header matching Image 2: "← Room Details" */}
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
                Room Details
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

          {/* Form Content matching Image 2 */}
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-4 overflow-y-auto flex-1 text-xs"
          >
            {/* 1. Property * */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Property <span className="text-rose-500">*</span>
              </label>
              {properties.length > 1 ? (
                <div className="relative">
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2F54EB] appearance-none"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              ) : (
                <input
                  type="text"
                  value={activeProperty?.name || activePropertyName || "Vanalilka"}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-800 bg-slate-50/60 cursor-default"
                />
              )}
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
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#2F54EB]"
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
                    onChange={(e) => handleSharingChange(e.target.value)}
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

            {/* Bed Chips Preview & Custom Labels */}
            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span>Bed Inventory Generated:</span>
                <span className="text-[#2F54EB] font-bold">
                  {bedList.length} Beds
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {bedList.map((bed, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <Bed className="h-3.5 w-3.5 text-[#2F54EB]" />
                      <input
                        type="text"
                        value={bed.name}
                        onChange={(e) => {
                          const updated = [...bedList];
                          updated[idx].name = e.target.value;
                          setBedList(updated);
                        }}
                        className="w-16 font-bold text-slate-800 text-xs focus:outline-none"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      ₹{amountPerBed}
                    </span>
                  </div>
                ))}
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
                    name="isAvailableToRent"
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
                    name="isAvailableToRent"
                    value="no"
                    checked={isAvailableToRent === "no"}
                    onChange={() => setIsAvailableToRent("no")}
                    className="h-4 w-4 text-[#2F54EB] focus:ring-[#2F54EB]"
                  />
                  <span className="text-xs font-semibold text-slate-800">No</span>
                </label>
              </div>
            </div>

            {/* 7. Room Facilities matching Image 2 */}
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

            {/* Submit Button matching Image 2: "Add Room" */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={addRoomMutation.isPending}
                className="w-full py-3.5 rounded-2xl bg-[#2F54EB] hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {addRoomMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <span>Add Room</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
