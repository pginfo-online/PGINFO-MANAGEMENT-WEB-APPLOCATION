"use client";

import React, { useState } from "react";
import {
  Building2,
  X,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Check,
} from "lucide-react";
import { useUiStore, usePropertyStore } from "@/lib/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

const PROPERTY_TYPES = [
  { value: "PG", label: "Paying Guest (PG)" },
  { value: "HOSTEL", label: "Hostel" },
  { value: "FLAT", label: "Apartment / Flat" },
  { value: "COLIVING", label: "Co-Living Space" },
  { value: "RK", label: "1RK / Studio Room" },
];

const COMMON_AMENITIES = [
  "Wi-Fi",
  "Air Conditioner",
  "Power Backup",
  "CCTV Security",
  "Food / Mess Included",
  "Daily Housekeeping",
  "Laundry Machine",
  "Attached Washroom",
  "Elevator / Lift",
  "RO Drinking Water",
  "Geyser / Hot Water",
  "Biometric Access",
];

export default function AddPropertyModal() {
  const { isAddPropertyOpen, setAddPropertyOpen } = useUiStore();
  const { setSelectedPropertyId } = usePropertyStore();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [type, setType] = useState("PG");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("Pune");
  const [state, setState] = useState("Maharashtra");
  const [pincode, setPincode] = useState("411057");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [totalFloors, setTotalFloors] = useState("3");
  const [rentDueDay, setRentDueDay] = useState("1");
  const [description, setDescription] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "Wi-Fi",
    "CCTV Security",
    "Daily Housekeeping",
    "RO Drinking Water",
  ]);
  const [errorMessage, setErrorMessage] = useState("");

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.properties.create(payload),
    onSuccess: (newProp) => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      if (newProp?.id) {
        setSelectedPropertyId(newProp.id, newProp.name);
      }
      toast.success(`Property "${name}" created successfully!`);
      handleClose();
    },
    onError: (err: any) => {
      setErrorMessage(
        err?.message || "Failed to create property. Please verify the details."
      );
    },
  });

  const handleClose = () => {
    setErrorMessage("");
    setName("");
    setAddressLine1("");
    setAddressLine2("");
    setContactPhone("");
    setContactEmail("");
    setDescription("");
    setAddPropertyOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Property name must be at least 2 characters.");
      return;
    }
    if (!addressLine1.trim() || addressLine1.trim().length < 3) {
      setErrorMessage("Address Line 1 is required (min 3 chars).");
      return;
    }
    if (!city.trim()) {
      setErrorMessage("City is required.");
      return;
    }
    if (!state.trim()) {
      setErrorMessage("State is required.");
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      setErrorMessage("Please enter a valid 6-digit Indian PIN code.");
      return;
    }
    if (contactPhone.trim() && !/^[6-9]\d{9}$/.test(contactPhone.trim())) {
      setErrorMessage("Contact phone must be a 10-digit mobile number.");
      return;
    }

    const payload = {
      name: name.trim(),
      type,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: "IN",
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      rentDueDay: parseInt(rentDueDay, 10) || 1,
      totalFloors: totalFloors ? parseInt(totalFloors, 10) : undefined,
      description: description.trim() || undefined,
      amenities: selectedAmenities,
    };

    createMutation.mutate(payload);
  };

  if (!isAddPropertyOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Register New Property
              </h2>
              <p className="text-xs text-slate-500">
                Add a new PG, hostel, or flat to your management portfolio
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Property Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Skyline Luxury Living"
                required
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Property Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Address Line 1 & Line 2 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Address (Street / Building) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Plot No 42, Hinjewadi Phase 1"
                required
                className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Pune"
                required
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Maharashtra"
                required
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PIN Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="411057"
                required
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Operational Settings: Floors & Rent Due Day */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Floors
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={totalFloors}
                  onChange={(e) => setTotalFloors(e.target.value)}
                  placeholder="3"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rent Due Day (1-28)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={rentDueDay}
                  onChange={(e) => setRentDueDay(e.target.value)}
                  placeholder="1"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Amenities Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">
                Amenities & Facilities
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedAmenities.length} selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_AMENITIES.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-left border transition cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-md flex items-center justify-center border text-[10px] ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating Property..." : "Create Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
