'use client';

import React, { useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/Select';
import { useAnnualDashboard } from '@/hooks/dashboard/useAnnualDashboard';
import { formatCurrency } from '@/utils/currency';
import { getShortMonthName } from '@/utils/date';

interface AnnualDashboardViewProps {
  initialYear: number;
}

export function AnnualDashboardView({ initialYear }: AnnualDashboardViewProps) {
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const { data: dashboard, isLoading } = useAnnualDashboard(selectedYear);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => {
    const year = currentYear - 5 + i;
    return { value: year, label: year.toString() };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-slate-600">No data available for this year</p>
      </div>
    );
  }

  const netSavings = dashboard.totalIncome - dashboard.totalExpenses;
  const savingsRate = dashboard.totalIncome > 0
    ? (dashboard.totalSaved / dashboard.totalIncome) * 100
    : 0;

  const maxMonthlyIncome = Math.max(...dashboard.monthlyBreakdown.map(m => m.income));
  const maxMonthlyExpenses = Math.max(...dashboard.monthlyBreakdown.map(m => m.expenses));

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800 mb-1">
              Annual Report
            </h1>
            <p className="text-slate-500 text-sm">Complete yearly financial overview and trends</p>
          </div>
          <div className="w-48">
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              options={yearOptions}
              className="h-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Income</p>
            <p className="text-2xl font-semibold text-slate-800">{formatCurrency(dashboard.totalIncome)}</p>
            <p className="text-xs text-slate-400 mt-1">Yearly earnings</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-rose-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Expenses</p>
            <p className="text-2xl font-semibold text-slate-800">{formatCurrency(dashboard.totalExpenses)}</p>
            <p className="text-xs text-slate-400 mt-1">Yearly spending</p>
          </div>

          <div className={`bg-white rounded-xl border ${netSavings >= 0 ? 'border-teal-200 hover:border-teal-300' : 'border-amber-200 hover:border-amber-300'} p-5 transition-colors`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${netSavings >= 0 ? 'bg-teal-50' : 'bg-amber-50'} flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${netSavings >= 0 ? 'text-teal-600' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={netSavings >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Net Savings</p>
            <p className={`text-2xl font-semibold ${netSavings >= 0 ? 'text-slate-800' : 'text-amber-700'}`}>
              {formatCurrency(netSavings)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Income - Expenses</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Savings Rate</p>
            <p className="text-2xl font-semibold text-slate-800">{savingsRate.toFixed(1)}%</p>
            <p className="text-xs text-slate-400 mt-1">Of total income</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-6">Monthly Breakdown</h3>
          <div className="space-y-4">
            {dashboard.monthlyBreakdown.map((monthData) => {
              const incomePercent = (monthData.income / maxMonthlyIncome) * 100;
              const expensePercent = (monthData.expenses / maxMonthlyExpenses) * 100;
              const net = monthData.income - monthData.expenses;
              
              return (
                <div key={monthData.month} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700 w-12 text-sm">{getShortMonthName(monthData.month)}</span>
                    <div className="flex-1 mx-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 flex items-center justify-end pr-3 transition-all duration-500 rounded-full"
                            style={{ width: `${incomePercent}%` }}
                          >
                            <span className="text-xs text-white font-semibold">{formatCurrency(monthData.income)}</span>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-600 w-16 font-medium">Income</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                          <div 
                            className="h-full bg-rose-500 flex items-center justify-end pr-3 transition-all duration-500 rounded-full"
                            style={{ width: `${expensePercent}%` }}
                          >
                            <span className="text-xs text-white font-semibold">{formatCurrency(monthData.expenses)}</span>
                          </div>
                        </div>
                        <span className="text-xs text-rose-600 w-16 font-medium">Expense</span>
                      </div>
                    </div>
                    <div className={`w-24 text-right font-semibold ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(net)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-6">Detailed Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Month</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Income</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Expenses</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Saved</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Net</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.monthlyBreakdown.map((monthData) => {
                  const net = monthData.income - monthData.expenses;
                  return (
                    <tr key={monthData.month} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-700 text-sm">{getShortMonthName(monthData.month)}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-semibold text-sm">{formatCurrency(monthData.income)}</td>
                      <td className="py-3 px-4 text-right text-rose-600 font-semibold text-sm">{formatCurrency(monthData.expenses)}</td>
                      <td className="py-3 px-4 text-right text-blue-600 font-semibold text-sm">{formatCurrency(monthData.saved)}</td>
                      <td className={`py-3 px-4 text-right font-semibold text-sm ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(net)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-300 bg-slate-50 font-semibold">
                  <td className="py-4 px-4 text-slate-800">Total</td>
                  <td className="py-4 px-4 text-right text-emerald-700 text-lg">{formatCurrency(dashboard.totalIncome)}</td>
                  <td className="py-4 px-4 text-right text-rose-700 text-lg">{formatCurrency(dashboard.totalExpenses)}</td>
                  <td className="py-4 px-4 text-right text-blue-700 text-lg">{formatCurrency(dashboard.totalSaved)}</td>
                  <td className={`py-4 px-4 text-right text-lg ${netSavings >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(netSavings)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}