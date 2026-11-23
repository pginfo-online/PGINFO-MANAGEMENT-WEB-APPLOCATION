"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { usePropertyStore, useUiStore } from "@/lib/store";
import { QueryError, Skeleton } from "../layout/WorkspaceUI";

export interface ExpenseRecord {
  id: string;
  propertyId: string;
  categoryId: string;
  amount: number;
  expenseDate: string;
  paymentMode: string;
  paidTo?: string;
  paidBy?: string;
  description: string;
}

export default function AddExpenseModal() {
  const { isAddExpenseOpen, setAddExpenseOpen } = useUiStore();
  return isAddExpenseOpen ? <ExpenseEditor close={() => setAddExpenseOpen(false)} /> : null;
}

export function ExpenseEditor({ expense, close }: { expense?: ExpenseRecord; close: () => void }) {
  const selectedPropertyId = usePropertyStore((state) => state.selectedPropertyId);
  const client = useQueryClient();
  const [propertyId, setPropertyId] = useState(expense?.propertyId ?? selectedPropertyId ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? "");
  const categories = useQuery({ queryKey: ["expenseCategories"], queryFn: api.expenses.listCategories });
  const properties = useQuery({ queryKey: ["properties", "expense-picker"], queryFn: () => api.properties.list({ limit: 100 }) });
  const addCategory = useMutation({
    mutationFn: api.expenses.createCategory,
    onSuccess(category) {
      client.setQueryData<NonNullable<typeof categories.data>>(["expenseCategories"], (previous) => [...(previous ?? []), category]);
      setCategoryId(category.id);
      setNewCategory("");
    },
  });
  const save = useMutation({
    mutationFn: (input: Record<string, unknown>) => expense ? api.expenses.update(expense.id, input) : api.expenses.create(input),
    onSuccess() {
      for (const key of ["expenses", "dashboardMetrics", "money"]) void client.invalidateQueries({ queryKey: [key] });
      toast.success(expense ? "Expense updated" : "Expense recorded");
      close();
    },
  });
  const pending = save.isPending || addCategory.isPending;
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !pending) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="workspace-overlay" />
        <Dialog.Content className="workspace-dialog">
          <div className="flex justify-between gap-3"><div><Dialog.Title className="text-xl font-semibold">{expense ? "Edit expense" : "Record expense"}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-600">Enter the property, category and payment details.</Dialog.Description></div><Dialog.Close className="workspace-icon" aria-label="Close expense form" disabled={pending}><X className="size-5" /></Dialog.Close></div>
          {properties.error && <QueryError error={properties.error} retry={() => void properties.refetch()} />}
          {categories.error && <QueryError error={categories.error} retry={() => void categories.refetch()} />}
          {(properties.isPending || categories.isPending) && <div className="mt-4"><Skeleton count={2} /></div>}
          {properties.isSuccess && categories.isSuccess && (
            <form className="workspace-form mt-5" onSubmit={(event) => {
              event.preventDefault();
              if (pending) return;
              const form = new FormData(event.currentTarget);
              const field = (key: string) => String(form.get(key) ?? "").trim();
              save.mutate({ propertyId, categoryId, amount: Math.round(Number(field("amount")) * 100), paymentMode: field("mode"), expenseDate: field("date"), paidBy: field("paidBy"), paidTo: field("paidTo"), description: field("description") });
            }}>
              <fieldset className="grid gap-4 sm:grid-cols-2" disabled={pending}>
                <label>Property<select required value={propertyId} onChange={(event) => setPropertyId(event.target.value)}><option value="">Choose a property</option>
                  {propertyId && !properties.data.data.some((property) => property.id === propertyId) && <option value={propertyId}>Selected property</option>}
                  {properties.data.data.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
                </select></label>
                <label>Category<select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Choose a category</option>{categories.data.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
                <div className="flex items-end gap-2 sm:col-span-2"><label className="flex-1">New category (optional)<input value={newCategory} maxLength={100} onChange={(event) => setNewCategory(event.target.value)} /></label><button type="button" className="workspace-button" disabled={pending || newCategory.trim().length < 2} onClick={() => addCategory.mutate(newCategory.trim())}>Add category</button></div>
                <label>Amount (₹)<input name="amount" required type="number" min=".01" max="21474836.47" step=".01" defaultValue={expense ? expense.amount / 100 : undefined} /></label>
                <label>Expense date<input name="date" required type="date" defaultValue={expense?.expenseDate.slice(0, 10) ?? today} /></label>
                <label>Payment method<select name="mode" defaultValue={expense?.paymentMode ?? "UPI"}><option value="UPI">UPI</option><option value="CASH">Cash</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CHEQUE">Cheque</option><option value="RAZORPAY">Razorpay</option><option value="OTHER">Other</option></select></label>
                <label>Paid by (optional)<input name="paidBy" defaultValue={expense?.paidBy} /></label>
                <label>Paid to (optional)<input name="paidTo" defaultValue={expense?.paidTo} /></label>
                <label className="sm:col-span-2">Description<textarea name="description" required rows={3} defaultValue={expense?.description} /></label>
              </fieldset>
              {(save.error || addCategory.error) && <p role="alert" className="mt-4 text-sm text-rose-700">{save.error?.message ?? addCategory.error?.message}</p>}
              <div className="mt-5 flex justify-end gap-2"><Dialog.Close className="workspace-button" disabled={pending}>Cancel</Dialog.Close><button className="workspace-button primary" disabled={pending || !categoryId}>{save.isPending ? "Saving…" : "Save expense"}</button></div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
