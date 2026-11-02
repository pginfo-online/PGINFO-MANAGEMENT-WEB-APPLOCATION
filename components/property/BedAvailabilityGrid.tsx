"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bed,
  CheckCircle2,
  AlertTriangle,
  User,
  ExternalLink,
  Plus,
} from "lucide-react";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatINR, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BedAvailabilityGrid() {
  const { selectedPropertyId } = usePropertyStore();

  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => api.properties.list(),
  });

  const properties = propertiesData?.data || [];
  const propertyId = selectedPropertyId || (properties[0]?.id ?? "");

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["rooms", propertyId],
    queryFn: () => (propertyId ? api.rooms.listByProperty(propertyId) : []),
    enabled: !!propertyId,
  });

  const roomList = rooms || [];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bed Vacancy Grid</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time visual bed availability matrix with live occupancy states
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span>Vacant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <span>Reserved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-orange-500" />
            <span>Under Notice</span>
          </div>
        </div>
      </div>

      {/* Grid of Rooms with individual bed slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roomList.map((room) => {
          const beds = room.beds || [];
          return (
            <div
              key={room.id}
              className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Room {room.roomNumber}</h3>
                  <span className="text-xs text-slate-400">
                    {room.floor || "Ground Floor"} · {room.sharingType}
                  </span>
                </div>
                <Link
                  href={`/property/rooms/${room.id}`}
                  className="p-1 text-slate-400 hover:text-blue-600 transition"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              {/* Beds layout */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                {beds.map((b: any) => {
                  const isVacant = b.status === "AVAILABLE";
                  return (
                    <div
                      key={b.id}
                      className={cn(
                        "p-3 rounded-2xl border transition flex flex-col justify-between h-24",
                        isVacant
                          ? "bg-emerald-50/50 border-emerald-200 hover:border-emerald-400"
                          : "bg-rose-50/50 border-rose-200 hover:border-rose-400"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{b.bedNumber}</span>
                        <Bed
                          className={cn(
                            "h-4 w-4",
                            isVacant ? "text-emerald-600" : "text-rose-600"
                          )}
                        />
                      </div>

                      <div>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.2 rounded uppercase block w-fit",
                            isVacant
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          )}
                        >
                          {b.status}
                        </span>
                        {isVacant ? (
                          <Link
                            href={`/people/tenants/addTenant?roomId=${room.id}&bedId=${b.id}`}
                            className="text-[11px] font-semibold text-blue-600 hover:underline mt-1 block"
                          >
                            + Allocate
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5">
                            Active Tenant
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
