'use client';

import React, { useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import ViewModeToggle from '@/components/shared/ViewModeToggle';
import { useMonthlyReport } from '@/hooks/dashboard/useMonthlyReport';
import { formatCurrency } from '@/utils/currency';
import { formatDate, getMonthName } from '@/utils/date';
import type { ViewMode } from '@/utils/period';

interface MonthlyReportViewProps {
  monthId: string;
  year: number;
  month: number;
}

function getEntryLabel(type: 'budget' | 'bill' | 'debt'): string {
  if (type === 'budget') return 'Budget';
  if (type === 'bill') return 'Bill Payment';
  return 'Debt Payment';
}

export function MonthlyReportView({ monthId, year, month }: MonthlyReportViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const { data: report, isLoading } = useMonthlyReport(monthId, viewMode);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-slate-600">Report not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800 mb-1">
              Monthly Report - {getMonthName(month)} {year}
            </h1>
            <p className="text-slate-500 text-sm">
              Receipt-style transactions for budget entries and paid bills/debts only
            </p>
          </div>
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Budget Added</p>
            <p className="text-2xl font-semibold text-emerald-700">{formatCurrency(report.totals.income)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Paid Bills + Debts</p>
            <p className="text-2xl font-semibold text-rose-700">{formatCurrency(report.totals.expenses)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Net</p>
            <p className={`text-2xl font-semibold ${report.totals.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(report.totals.net)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-4">
            Transactions ({report.entries.length})
          </h3>

          {report.entries.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500">
                No transactions for this {viewMode === 'monthly' ? 'month' : viewMode} yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Period</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.entries.map((entry) => {
                    const isBudget = entry.type === 'budget';
                    return (
                      <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm text-slate-700">{formatDate(entry.date)}</td>
                        <td className="py-3 px-4 text-sm text-slate-700">{getEntryLabel(entry.type)}</td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-800">{entry.title}</td>
                        <td className="py-3 px-4 text-sm text-slate-500 capitalize">{entry.category || '-'}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{entry.period}</td>
                        <td className={`py-3 px-4 text-right text-sm font-semibold ${isBudget ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isBudget ? '+' : '-'}{formatCurrency(entry.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
