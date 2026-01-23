'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StatWidget } from '@/components/shared/StatWidget';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useMonthlyDashboard } from '@/hooks/dashboard/useMonthlyDashboard';
import { useMonth } from '@/hooks/months/queries/useMonth';
import { useUpdateMonth } from '@/hooks/months/mutations/useUpdateMonth';
import { formatCurrency } from '@/utils/currency';

interface MonthlyDashboardViewProps {
  monthId: string;
  year: number;
  month: number;
}

export function MonthlyDashboardView({ monthId, year, month }: MonthlyDashboardViewProps) {
  const router = useRouter();
  const [isEditIncomeOpen, setIsEditIncomeOpen] = useState(false);
  const [newIncome, setNewIncome] = useState('');

  const { data: dashboard, isLoading: isDashboardLoading } = useMonthlyDashboard(monthId);
  const { data: monthData } = useMonth(monthId);
  const updateMonth = useUpdateMonth();

  const handleUpdateIncome = async () => {
    const income = parseFloat(newIncome);
    if (isNaN(income) || income < 0) return;

    await updateMonth.mutateAsync({
      monthId,
      data: { totalIncome: income },
    });

    setIsEditIncomeOpen(false);
    setNewIncome('');
  };

  if (isDashboardLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-slate-600">Dashboard not found</p>
      </div>
    );
  }

  const savingsProgress = dashboard.totalIncome > 0 
    ? (dashboard.savings.totalSaved / dashboard.totalIncome) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800 mb-1">
              Financial Overview
            </h1>
            <p className="text-slate-500 text-sm">Monitor your income, expenses, and savings goals</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setNewIncome(dashboard.totalIncome.toString());
              setIsEditIncomeOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0 flex items-center gap-2 h-10 px-5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Income
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Income */}
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
            <p className="text-xs text-slate-400 mt-1">Monthly earnings</p>
          </div>

          {/* Total Expenses */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-rose-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Expenses</p>
            <p className="text-2xl font-semibold text-slate-800">{formatCurrency(dashboard.summary.totalExpenses)}</p>
            <p className="text-xs text-slate-400 mt-1">Bills + Debts</p>
          </div>

          {/* Remaining */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${dashboard.summary.remainingIncome >= 0 ? 'bg-teal-50' : 'bg-amber-50'} flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${dashboard.summary.remainingIncome >= 0 ? 'text-teal-600' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Remaining</p>
            <p className={`text-2xl font-semibold ${dashboard.summary.remainingIncome >= 0 ? 'text-slate-800' : 'text-amber-700'}`}>
              {formatCurrency(dashboard.summary.remainingIncome)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Available funds</p>
          </div>

          {/* Savings Rate */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Savings Rate</p>
            <p className="text-2xl font-semibold text-slate-800">{dashboard.summary.savingsRate.toFixed(1)}%</p>
            <p className="text-xs text-slate-400 mt-1">Of total income</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Savings Progress */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-6">Savings Progress</h3>
            <div className="flex flex-col items-center">
              <ProgressRing 
                progress={savingsProgress}
                size={140}
                strokeWidth={10}
                color="#10b981"
                value={formatCurrency(dashboard.savings.totalSaved)}
              />
              <div className="mt-6 text-center space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Target Amount</p>
                <p className="text-xl font-semibold text-slate-800">{formatCurrency(dashboard.savings.totalTarget)}</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full mt-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs font-medium text-emerald-700">{dashboard.savings.count} Active Goals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bills Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-700">Bills</h3>
              </div>
              <Link href={`/bills/${monthId}`}>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors text-xs font-medium group border border-slate-200">
                  <span>View All</span>
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-0.5">Total Amount</p>
                  <p className="text-xl font-semibold text-slate-800">{formatCurrency(dashboard.bills.total)}</p>
                </div>
                <div className="w-11 h-11 rounded-lg bg-sky-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="text-xs font-medium text-emerald-700 mb-1">Paid</p>
                  <p className="text-lg font-semibold text-emerald-800">{formatCurrency(dashboard.bills.paid)}</p>
                  <p className="text-xs text-emerald-600 mt-1">{dashboard.bills.count - Math.ceil((dashboard.bills.unpaid / dashboard.bills.total) * dashboard.bills.count)} bills</p>
                </div>
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
                  <p className="text-xs font-medium text-rose-700 mb-1">Unpaid</p>
                  <p className="text-lg font-semibold text-rose-800">{formatCurrency(dashboard.bills.unpaid)}</p>
                  <p className="text-xs text-rose-600 mt-1">{Math.ceil((dashboard.bills.unpaid / dashboard.bills.total) * dashboard.bills.count)} bills</p>
                </div>
              </div>
            </div>
          </div>

          {/* Debts Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-700">Debts</h3>
              </div>
              <Link href={`/debts/${monthId}`}>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors text-xs font-medium group border border-slate-200">
                  <span>View All</span>
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-0.5">Total Balance</p>
                  <p className="text-xl font-semibold text-slate-800">{formatCurrency(dashboard.debts.totalBalance)}</p>
                </div>
                <div className="w-11 h-11 rounded-lg bg-violet-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500">Min. Payment</span>
                  <span className="text-sm font-semibold text-slate-700">{formatCurrency(dashboard.debts.totalMinimumPayment)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-emerald-600">Amount Paid</span>
                  <span className="text-sm font-semibold text-emerald-700">{formatCurrency(dashboard.debts.totalPaid)}</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min((dashboard.debts.totalPaid / dashboard.debts.totalMinimumPayment) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Savings Goals */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-700">Savings Goals</h3>
            </div>
            <Link href={`/savings/${monthId}`}>
              <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-9 px-4 text-sm">
                Manage Goals
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-2">Active Goals</p>
              <p className="text-3xl font-semibold text-emerald-900">{dashboard.savings.count}</p>
            </div>
            <div className="p-5 rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100">
              <p className="text-xs font-medium text-sky-700 uppercase tracking-wide mb-2">Total Target</p>
              <p className="text-2xl font-semibold text-sky-900">{formatCurrency(dashboard.savings.totalTarget)}</p>
            </div>
            <div className="p-5 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
              <p className="text-xs font-medium text-violet-700 uppercase tracking-wide mb-2">Total Saved</p>
              <p className="text-2xl font-semibold text-violet-900">{formatCurrency(dashboard.savings.totalSaved)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Income Modal */}
      <Modal
        isOpen={isEditIncomeOpen}
        onClose={() => setIsEditIncomeOpen(false)}
        title="Edit Monthly Income"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Total Income"
            type="number"
            value={newIncome}
            onChange={(e) => setNewIncome(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          <div className="flex justify-end space-x-3">
            <Button variant="ghost" onClick={() => setIsEditIncomeOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateIncome}
              isLoading={updateMonth.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}