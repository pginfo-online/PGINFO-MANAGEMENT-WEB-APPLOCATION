'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Wallet,
  Receipt,
  Calendar,
  Percent,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi } from '@/features/dashboard/api/dashboard.api';
import { formatINR } from '@/lib/utils';
import type { FinancialReport } from '@/types/dashboard';

export default function FinancialReportsPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;

  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  const { data, isLoading } = useQuery({
    queryKey: ['financial-report', selectedYear, propertyId],
    queryFn: () => dashboardApi.getFinancialReport(selectedYear, propertyId),
    enabled: !!propertyId,
  });

  const report: FinancialReport | undefined = data?.data;
  const monthlyData = report?.report || [];

  const maxVal = Math.max(
    ...monthlyData.map((m) => Math.max(m.revenue, m.expenses, 1)),
    1000
  );

  return (
    <DashboardLayout propertyId={propertyId}>
      <PageHeader
        title="Financial P&L Analytics"
        description="Comprehensive profit and loss statement, cashflow tracking, and month-by-month financial ledger."
        breadcrumbs={[
          { label: 'Properties', href: '/dashboard' },
          { label: 'Overview', href: `/properties/${propertyId}` },
          { label: 'Financial Reports' },
        ]}
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-400" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
          >
            {[2024, 2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>
                Year {yr}
              </option>
            ))}
          </select>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Key Annual KPI Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Annual Rent Collected"
              value={formatINR(report?.totalRevenue || 0)}
              subtitle={`Total invoiced: ${formatINR(report?.totalDue || 0)}`}
              icon={<Receipt className="h-5 w-5" />}
              accentColor="emerald"
            />
            <StatCard
              title="Annual Expenses"
              value={formatINR(report?.totalExpenses || 0)}
              subtitle="Total property operational outlays"
              icon={<Wallet className="h-5 w-5" />}
              accentColor="amber"
            />
            <StatCard
              title="Net Operating Profit"
              value={formatINR(report?.netProfit || 0)}
              subtitle={
                (report?.totalRevenue || 0) > 0
                  ? `${Math.round(
                      ((report?.netProfit || 0) / (report?.totalRevenue || 1)) * 100
                    )}% net operating margin`
                  : '—'
              }
              icon={<TrendingUp className="h-5 w-5" />}
              accentColor={(report?.netProfit || 0) >= 0 ? 'emerald' : 'rose'}
            />
            <StatCard
              title="Collection Efficiency"
              value={
                (report?.totalDue || 0) > 0
                  ? `${Math.round(
                      ((report?.totalRevenue || 0) / (report?.totalDue || 1)) * 100
                    )}%`
                  : '100%'
              }
              subtitle="Realized collection of billed rents"
              icon={<Percent className="h-5 w-5" />}
              accentColor="sky"
            />
          </div>

          {/* Visual Monthly Revenue vs Expense Chart */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Monthly Cash Flow Comparison</h3>
                <p className="text-xs text-slate-400">Revenue (Collected Rent) vs Operating Expenses</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Expenses
                </span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-6 sm:grid-cols-12 gap-2 sm:gap-4 items-end h-64 pt-6 pb-2">
              {monthlyData.map((item) => {
                const revHeight = Math.round((item.revenue / maxVal) * 100);
                const expHeight = Math.round((item.expenses / maxVal) * 100);

                return (
                  <div key={item.month} className="flex flex-col items-center h-full justify-end">
                    <div className="flex items-end gap-1 w-full justify-center h-48">
                      {/* Revenue Bar */}
                      <div
                        className="w-2.5 sm:w-4 rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-300 hover:brightness-125"
                        style={{ height: `${Math.max(4, revHeight)}%` }}
                        title={`${item.month} Revenue: ${formatINR(item.revenue)}`}
                      />
                      {/* Expense Bar */}
                      <div
                        className="w-2.5 sm:w-4 rounded-t-sm bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-300 hover:brightness-125"
                        style={{ height: `${Math.max(4, expHeight)}%` }}
                        title={`${item.month} Expense: ${formatINR(item.expenses)}`}
                      />
                    </div>
                    <span className="mt-2 text-[10px] sm:text-xs font-semibold uppercase text-slate-400">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Ledger Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Monthly Statement of Accounts</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Month</th>
                    <th className="px-6 py-4">Invoiced Due</th>
                    <th className="px-6 py-4">Rent Collected</th>
                    <th className="px-6 py-4">Expenses</th>
                    <th className="px-6 py-4">Net Operating Profit</th>
                    <th className="px-6 py-4 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {monthlyData.map((row) => {
                    const margin =
                      row.revenue > 0 ? Math.round((row.profit / row.revenue) * 100) : 0;

                    return (
                      <tr key={row.month} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-sans font-semibold text-white">
                          {row.month} {selectedYear}
                        </td>
                        <td className="px-6 py-4 text-slate-400">{formatINR(row.due)}</td>
                        <td className="px-6 py-4 font-semibold text-emerald-400">
                          {formatINR(row.revenue)}
                        </td>
                        <td className="px-6 py-4 text-amber-400">{formatINR(row.expenses)}</td>
                        <td
                          className={`px-6 py-4 font-bold ${
                            row.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatINR(row.profit)}
                        </td>
                        <td className="px-6 py-4 text-right font-sans text-xs">
                          <span
                            className={`rounded-full px-2 py-0.5 font-bold ${
                              row.profit >= 0
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {margin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
