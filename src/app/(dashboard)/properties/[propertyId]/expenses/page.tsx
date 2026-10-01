'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  Plus,
  CheckCircle2,
  XCircle,
  Trash2,
  Receipt,
  Tag,
  Clock,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { expenseApi } from '@/features/expenses/api/expense.api';
import { formatINR, formatDate } from '@/lib/utils';
import type {
  Expense,
  ExpenseCategory,
  ExpensePaymentMethod,
  CreateExpensePayload,
} from '@/types/expense';

export default function ExpensesManagementPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;
  const queryClient = useQueryClient();

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [category, setCategory] = useState<ExpenseCategory>('maintenance');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [vendor, setVendor] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch Expenses
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['pg-expenses', propertyId, categoryFilter],
    queryFn: () =>
      expenseApi.getExpenses(propertyId, {
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      }),
    enabled: !!propertyId,
  });

  // Fetch Expense Summary
  const { data: summaryData } = useQuery({
    queryKey: ['pg-expenses-summary', propertyId],
    queryFn: () => expenseApi.getExpenseSummary(propertyId),
    enabled: !!propertyId,
  });

  const expenses: Expense[] = expensesData?.data || [];
  const summary = summaryData?.data;

  // Add Expense Mutation
  const addExpenseMutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) => expenseApi.createExpense(propertyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pg-expenses', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pg-expenses-summary', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-dashboard', propertyId] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => expenseApi.approveExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pg-expenses', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pg-expenses-summary', propertyId] });
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: (id: string) => expenseApi.rejectExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pg-expenses', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pg-expenses-summary', propertyId] });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pg-expenses', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['pg-expenses-summary', propertyId] });
    },
  });

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setVendor('');
    setVendorPhone('');
    setReferenceNumber('');
    setNotes('');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    addExpenseMutation.mutate({
      category,
      description: description.trim(),
      amount: parseFloat(amount),
      expenseDate,
      vendor: vendor.trim() || undefined,
      vendorPhone: vendorPhone.trim() || undefined,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const categories: ExpenseCategory[] = [
    'maintenance',
    'utilities',
    'electricity',
    'water',
    'staff_salary',
    'food',
    'groceries',
    'cleaning',
    'repairs',
    'security',
    'internet',
    'other',
  ];

  return (
    <DashboardLayout propertyId={propertyId}>
      <PageHeader
        title="Expense Tracker"
        description="Track utility bills, staff salaries, repairs, and vendor payables."
        breadcrumbs={[
          { label: 'Properties', href: '/dashboard' },
          { label: 'Overview', href: `/properties/${propertyId}` },
          { label: 'Expenses' },
        ]}
      >
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Log Expense</span>
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Operating Costs"
          value={formatINR(summary?.totalAmount || 0)}
          subtitle="Consolidated PG operational outlays"
          icon={<Wallet className="h-5 w-5" />}
          accentColor="amber"
        />
        <StatCard
          title="Recorded Expenses"
          value={expenses.length}
          subtitle="Total operational billing vouchers"
          icon={<Receipt className="h-5 w-5" />}
          accentColor="sky"
        />
        <StatCard
          title="Pending Approvals"
          value={expenses.filter((e) => e.status === 'pending').length}
          subtitle="Vouchers requiring review"
          icon={<Clock className="h-5 w-5" />}
          accentColor="rose"
        />
      </div>

      {/* Category Filter Chips */}
      <div className="mt-6 flex flex-wrap items-center gap-1.5 overflow-x-auto border-b border-slate-800 pb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
          <Tag className="h-3.5 w-3.5 text-emerald-400" />
          Category:
        </span>
        <button
          onClick={() => setCategoryFilter('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
            categoryFilter === 'all'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
              categoryFilter === cat
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Wallet className="h-8 w-8 text-emerald-400" />}
            title="No expenses logged for this category"
            description="Keep your property P&L accurate by recording vendor and operational expenses."
            actionLabel="Log First Expense"
            onAction={() => setIsAddOpen(true)}
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Expense Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expenses.map((expense) => (
                  <tr
                    key={expense._id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">{expense.description}</p>
                        <p className="text-xs text-slate-500 capitalize">
                          Paid via {expense.paymentMethod.replace('_', ' ')}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium capitalize text-slate-300">
                        {expense.category.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {formatDate(expense.expenseDate)}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-300">
                      {expense.vendor || '—'}
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-amber-400">
                      {formatINR(expense.amount)}
                    </td>

                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          expense.status === 'approved'
                            ? 'default'
                            : expense.status === 'rejected'
                            ? 'destructive'
                            : 'warning'
                        }
                        dot
                      >
                        {expense.status}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {expense.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(expense._id)}
                              className="rounded p-1 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Approve Expense"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(expense._id)}
                              className="rounded p-1 text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Reject Expense"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            if (confirm('Delete this expense entry?')) {
                              deleteMutation.mutate(expense._id);
                            }
                          }}
                          className="rounded p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Expense Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Operational Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-300">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="mt-1 flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 capitalize"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-300">
                Description *
              </label>
              <Input
                placeholder="e.g. October Water Tanker Refill"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Amount (₹) *
                </label>
                <Input
                  type="number"
                  placeholder="2500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Expense Date *
                </label>
                <Input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Vendor Name
                </label>
                <Input
                  placeholder="e.g. Kaveri Waters"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as ExpensePaymentMethod)
                  }
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Debit/Credit Card</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={addExpenseMutation.isPending}>
                Save Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
