"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import AllocationFields, { useAllocationInventory } from "./AllocationFields";

export default function ChangeAllocationDialog({ tenant, close }: {
  tenant: { id: string; propertyId: string; roomId?: string; bedId?: string };
  close: () => void;
}) {
  const [value, setValue] = useState({ propertyId: tenant.propertyId, roomId: "", bedId: "" });
  const client = useQueryClient();
  const inventory = useAllocationInventory(value);
  const valid = inventory.property.isSuccess && !!inventory.selectedRoom && inventory.detail.isSuccess &&
    (!value.bedId || inventory.beds.some((bed) => bed.id === value.bedId)) &&
    (value.roomId !== tenant.roomId || !!value.bedId);
  const change = useMutation({
    mutationFn: () => api.residents.reallocate(tenant.id, {
      propertyId: value.propertyId, roomId: value.roomId, bedId: value.bedId || undefined,
      reason: value.propertyId === tenant.propertyId ? "room_change" : "property_change",
    }),
    onSuccess() {
      for (const key of ["resident", "residents", "room", "rooms", "inventoryStats", "dashboardMetrics", "billing", "money"]) void client.invalidateQueries({ queryKey: [key] });
      toast.success("Tenant allocation updated");
      close();
    },
  });
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !change.isPending) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="workspace-overlay" />
        <Dialog.Content className="workspace-dialog">
          <div className="flex justify-between gap-3">
            <div><Dialog.Title className="text-xl font-semibold">Change room or property</Dialog.Title><Dialog.Description className="text-sm text-slate-600">Choose the destination before moving the tenant.</Dialog.Description></div>
            <Dialog.Close className="workspace-icon" aria-label="Close allocation form" disabled={change.isPending}><X className="size-5" /></Dialog.Close>
          </div>
          <form className="workspace-form mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); if (valid && !change.isPending) change.mutate(); }}>
            <fieldset className="space-y-3" disabled={change.isPending}><AllocationFields value={value} change={setValue} inventory={inventory} requireRoom /></fieldset>
            {change.error && <p role="alert" className="text-sm text-rose-700">{change.error.message}</p>}
            <div className="flex justify-end gap-2"><Dialog.Close className="workspace-button" disabled={change.isPending}>Cancel</Dialog.Close><button className="workspace-button primary" disabled={!valid || change.isPending}>{change.isPending ? "Moving…" : "Move tenant"}</button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
