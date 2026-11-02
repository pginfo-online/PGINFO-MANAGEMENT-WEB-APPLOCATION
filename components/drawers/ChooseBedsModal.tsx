"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Bed, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChooseBedsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: any | null;
  propertyId?: string;
}

export default function ChooseBedsModal({
  isOpen,
  onClose,
  room,
  propertyId,
}: ChooseBedsModalProps) {
  const router = useRouter();
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);

  if (!isOpen || !room) return null;

  const beds = room.beds || [];

  const handleConfirm = () => {
    if (!selectedBedId) {
      toast.error("Please select a vacant bed");
      return;
    }

    const selectedBed = beds.find((b: any) => b.id === selectedBedId);
    const bedNumber = selectedBed?.bedNumber || "BedA";

    onClose();
    // Navigate to Add Tenant page with pre-selected room and bed
    router.push(
      `/people/tenants/addTenant?roomId=${room.id}&bedId=${selectedBedId}&bedNumber=${encodeURIComponent(
        bedNumber
      )}${propertyId ? `&propertyId=${propertyId}` : ""}`
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Choose Beds</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="font-semibold text-sm text-slate-900">
            {room.roomNumber}
          </div>

          {/* Beds List */}
          <div className="space-y-2.5">
            {beds.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No beds configured for this room.
              </p>
            ) : (
              beds.map((bed: any) => {
                const isOccupied =
                  bed.status === "OCCUPIED" ||
                  (bed.residents && bed.residents.length > 0);
                const isSelected = selectedBedId === bed.id;

                return (
                  <div
                    key={bed.id}
                    onClick={() => {
                      if (!isOccupied) {
                        setSelectedBedId(bed.id);
                      }
                    }}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-2xl border transition select-none",
                      isOccupied
                        ? "bg-slate-50/60 border-slate-200/60 opacity-75 cursor-not-allowed"
                        : isSelected
                        ? "bg-blue-50/60 border-blue-500 shadow-xs cursor-pointer"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer"
                    )}
                  >
                    {/* Left: Checkbox & Name */}
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-5 w-5 rounded-lg border flex items-center justify-center transition",
                          isOccupied
                            ? "border-slate-300 bg-slate-200/60 text-transparent"
                            : isSelected
                            ? "bg-[#2F54EB] border-[#2F54EB] text-white"
                            : "border-slate-300 bg-white"
                        )}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>

                      <span className="font-semibold text-sm text-slate-900">
                        {bed.bedNumber}
                      </span>
                    </div>

                    {/* Right: Status Badge matching ref-3 */}
                    <div>
                      {isOccupied ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/80">
                          Occupied
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-500 border border-rose-200/80">
                          Vacant
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Confirm Button */}
          <div className="pt-2">
            <button
              onClick={handleConfirm}
              disabled={!selectedBedId}
              className={cn(
                "w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2",
                selectedBedId
                  ? "bg-[#2F54EB] hover:bg-blue-700 shadow-blue-500/25 active:scale-[0.99]"
                  : "bg-[#9CB0F8] cursor-not-allowed shadow-none"
              )}
            >
              Confirm beds
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
