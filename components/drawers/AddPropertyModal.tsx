"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { QueryError, Skeleton } from "../layout/WorkspaceUI";
import { usePropertyStore, useUiStore } from "@/lib/store";

const types = [
  ["PG", "Paying guest"], ["HOSTEL", "Hostel"], ["CO_LIVING", "Co-living"],
  ["FLAT", "Flat"], ["APARTMENT", "Apartment"], ["RK", "Room and kitchen"], ["OTHER", "Other"],
];

export default function AddPropertyModal({ editId, onClose }: { editId?: string; onClose?: () => void } = {}) {
  const { isAddPropertyOpen, setAddPropertyOpen } = useUiStore();
  const select = usePropertyStore((state) => state.setSelectedPropertyId);
  const client = useQueryClient();
  const property = useQuery({
    queryKey: ["properties", "detail", editId],
    queryFn: () => api.properties.get(editId!),
    enabled: !!editId,
  });
  const initial = property.data;
  const open = !!editId || isAddPropertyOpen;
  const finish = () => onClose ? onClose() : setAddPropertyOpen(false);
  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => editId ? api.properties.update(editId, payload) : api.properties.create(payload),
    onSuccess(property) {
      void client.invalidateQueries({ queryKey: ["properties"] });
      void client.invalidateQueries({ queryKey: ["dashboardMetrics"] });
      select(property.id, property.name);
      finish();
      toast.success(editId ? "Property updated" : "Property created");
    },
  });

  function close(open: boolean) {
    if (mutation.isPending) return;
    mutation.reset();
    if (!open) finish();
  }

  return (
    <Dialog.Root open={open} onOpenChange={close}>
      <Dialog.Portal>
        <Dialog.Overlay className="workspace-overlay" />
        <Dialog.Content className="workspace-dialog">
          <div className="flex justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-semibold">{editId ? "Edit property" : "Add property"}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-600">Enter the property, address and contact details.</Dialog.Description>
            </div>
            <Dialog.Close className="workspace-icon" aria-label="Close property form" disabled={mutation.isPending}><X className="size-5" /></Dialog.Close>
          </div>
          {editId && property.isPending && <div className="mt-5"><Skeleton count={3} /></div>}
          {property.error && <QueryError error={property.error} retry={() => void property.refetch()} />}
          {(!editId || initial) && <form className="workspace-form mt-5" onSubmit={(event) => {
            event.preventDefault();
            if (mutation.isPending) return;
            const data = new FormData(event.currentTarget);
            const optionalFields = ["contactPhone", "contactEmail", "totalFloors", "ownerName"];
            const payload = Object.fromEntries(Array.from(data, ([key, value]) => [key, String(value).trim()]).filter(([key, value]) => value || (editId && !optionalFields.includes(key))));
            const amenities = String(payload.amenities ?? "").split(",").map((value) => value.trim()).filter(Boolean);
            mutation.mutate({ ...payload, amenities });
          }}>
            <fieldset disabled={mutation.isPending} className="grid gap-4 sm:grid-cols-2">
              <label>Property name<input name="name" defaultValue={initial?.name ?? ""} required minLength={2} /></label>
              <label>Owner name<input name="ownerName" defaultValue={initial?.ownerName ?? ""} required minLength={2} /></label>
              <label>Property type<select name="type" defaultValue={initial?.type ?? "PG"}>{types.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>
              <label>Rent due day<input name="rentDueDay" type="number" min={1} max={28} defaultValue={initial?.rentDueDay ?? 1} /></label>
              <label className="sm:col-span-2">Street address<input name="addressLine1" defaultValue={initial?.addressLine1 ?? ""} autoComplete="address-line1" required minLength={3} /></label>
              <label className="sm:col-span-2">Address line 2 (optional)<input name="addressLine2" defaultValue={initial?.addressLine2 ?? ""} autoComplete="address-line2" /></label>
              <label>City<input name="city" defaultValue={initial?.city ?? ""} autoComplete="address-level2" required minLength={2} /></label>
              <label>State<input name="state" defaultValue={initial?.state ?? ""} autoComplete="address-level1" required minLength={2} /></label>
              <label>PIN code<input name="pincode" defaultValue={initial?.pincode ?? ""} autoComplete="postal-code" required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} title="Enter a six-digit Indian PIN code" /></label>
              <label>Total floors (optional)<input name="totalFloors" defaultValue={initial?.totalFloors ?? ""} type="number" min={1} /></label>
              <label>Contact phone (optional)<input name="contactPhone" defaultValue={initial?.contactPhone ?? ""} type="tel" autoComplete="tel-national" pattern="[6-9][0-9]{9}" title="Enter a ten-digit Indian mobile number" /></label>
              <label>Contact email (optional)<input name="contactEmail" defaultValue={initial?.contactEmail ?? ""} type="email" autoComplete="email" /></label>
              <label className="sm:col-span-2">Description (optional)<textarea name="description" defaultValue={initial?.description ?? ""} rows={2} /></label>
              <label className="sm:col-span-2">Amenities (comma separated)<input name="amenities" defaultValue={initial?.amenities?.join(", ") ?? ""} /></label>
            </fieldset>
            {mutation.error && <p className="mt-4 text-sm text-rose-700" role="alert">{mutation.error.message}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close className="workspace-button" disabled={mutation.isPending}>Cancel</Dialog.Close>
              <button className="workspace-button primary" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : editId ? "Save property" : "Create property"}</button>
            </div>
          </form>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
