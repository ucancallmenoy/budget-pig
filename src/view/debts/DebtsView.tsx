'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { CategoryBadge } from '@/components/shared/CategoryBadge';
import { useDebts } from '@/hooks/debts/queries/useDebts';
import { useCreateDebt } from '@/hooks/debts/mutations/useCreateDebt';
import { useUpdateDebt } from '@/hooks/debts/mutations/useUpdateDebt';
import { useDeleteDebt } from '@/hooks/debts/mutations/useDeleteDebt';
import { useRecordPayment } from '@/hooks/debts/mutations/useRecordPayment';
import { Debt, DebtType, PaymentFrequency } from '@/types/debt';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { DEBT_TYPES } from '@/utils/constants';
import { calculatePaymentProgress, isPaymentOverdue, getDaysUntilPayment, getNextPaymentDate, getMonthPaymentStatus, getMonthPaymentAmount, getTotalPaidAllTime, getRemainingBalance } from '@/utils/debt';

interface DebtsViewProps {
  monthId: string;
  year: number;
  month: number;
}

export function DebtsView({ monthId, year, month }: DebtsViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<Debt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid_off' | 'unpaid' | 'overdue'>('all');
  const [createPaymentFrequency, setCreatePaymentFrequency] = useState<PaymentFrequency>('monthly');
  const [createPaymentDueDate, setCreatePaymentDueDate] = useState('1');
  const [editPaymentFrequency, setEditPaymentFrequency] = useState<PaymentFrequency>('monthly');
  const [editPaymentDueDate, setEditPaymentDueDate] = useState('1');
  const [paymentAmount, setPaymentAmount] = useState('');

  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState<DebtType>('credit_card');
  const [createBalance, setCreateBalance] = useState('');
  const [createMinPayment, setCreateMinPayment] = useState('');
  const [createDurationMonths, setCreateDurationMonths] = useState('1');
  const [createInterestRate, setCreateInterestRate] = useState('');

  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<DebtType>('credit_card');
  const [editBalance, setEditBalance] = useState('');
  const [editMinPayment, setEditMinPayment] = useState('');
  const [editDurationMonths, setEditDurationMonths] = useState('1');
  const [editInterestRate, setEditInterestRate] = useState('');

  const { data: debts, isLoading } = useDebts(year, month);
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();
  const deleteDebt = useDeleteDebt();
  const recordPayment = useRecordPayment();

  const handleCreateDebt = async () => {
    const balance = parseFloat(createBalance);
    const minPayment = parseFloat(createMinPayment);
    const durationMonths = parseInt(createDurationMonths) || 1;
    const interestRate = parseFloat(createInterestRate) || 0;
    const paymentDueDate = parseInt(createPaymentDueDate);

    if (!createName || !createBalance || !createMinPayment || isNaN(balance) || isNaN(minPayment) || isNaN(paymentDueDate)) return;

    await createDebt.mutateAsync({
      name: createName,
      type: createType,
      originalBalance: balance,
      minimumPayment: minPayment,
      durationMonths,
      interestRate,
      paymentFrequency: createPaymentFrequency,
      paymentDueDate,
      startMonth: month,
      startYear: year,
    });

    setCreateName('');
    setCreateType('credit_card');
    setCreateBalance('');
    setCreateMinPayment('');
    setCreateDurationMonths('1');
    setCreateInterestRate('');
    setCreatePaymentFrequency('monthly');
    setCreatePaymentDueDate('1');
    setIsCreateModalOpen(false);
  };

  const handleEditDebt = async () => {
    if (!selectedDebt) return;

    const balance = parseFloat(editBalance);
    const minPayment = parseFloat(editMinPayment);
    const durationMonths = parseInt(editDurationMonths) || 1;
    const interestRate = parseFloat(editInterestRate) || 0;
    const paymentDueDate = parseInt(editPaymentDueDate);

    if (!editName || !editBalance || !editMinPayment || isNaN(balance) || isNaN(minPayment) || isNaN(paymentDueDate)) return;

    await updateDebt.mutateAsync({
      debtId: selectedDebt._id,
      data: {
        name: editName,
        type: editType,
        originalBalance: balance,
        minimumPayment: minPayment,
        durationMonths,
        interestRate,
        paymentFrequency: editPaymentFrequency,
        paymentDueDate,
      },
    });

    setIsEditModalOpen(false);
    setSelectedDebt(null);
  };

  const handleRecordPayment = async () => {
    if (!selectedDebtForPayment) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount < 0) return;

    await recordPayment.mutateAsync({
      debtId: selectedDebtForPayment._id,
      monthId,
      amount,
    });

    setIsPaymentModalOpen(false);
    setSelectedDebtForPayment(null);
    setPaymentAmount('');
  };

  const handleDeleteDebt = async (debtId: string) => {
    if (!confirm('Are you sure you want to delete this debt?')) return;
    await deleteDebt.mutateAsync({ debtId });
  };

  const openEditModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setEditName(debt.name);
    setEditType(debt.type);
    setEditBalance(debt.originalBalance.toString());
    setEditMinPayment(debt.minimumPayment.toString());
    setEditDurationMonths(debt.durationMonths?.toString() || '1');
    setEditInterestRate(debt.interestRate?.toString() || '');
    setEditPaymentFrequency(debt.paymentFrequency || 'monthly');
    setEditPaymentDueDate(debt.paymentDueDate?.toString() || '1');
    setIsEditModalOpen(true);
  };

  const openPaymentModal = (debt: Debt) => {
    setSelectedDebtForPayment(debt);
    const currentPayment = getMonthPaymentAmount(debt, monthId);
    setPaymentAmount(currentPayment > 0 ? currentPayment.toString() : debt.minimumPayment.toString());
    setIsPaymentModalOpen(true);
  };

  const filteredDebts = useMemo(() => {
    if (!debts) return [];

    let filtered = debts;

    if (searchQuery) {
      filtered = filtered.filter(debt =>
        debt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        debt.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (filterStatus) {
      case 'paid_off':
        filtered = filtered.filter(debt => getRemainingBalance(debt) === 0);
        break;
      case 'unpaid':
        filtered = filtered.filter(debt => getMonthPaymentAmount(debt, monthId) < debt.minimumPayment);
        break;
      case 'overdue':
        filtered = filtered.filter(debt => isPaymentOverdue(debt, year, month, monthId));
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [debts, searchQuery, filterStatus, year, month, monthId]);

  const totalOriginalBalance = debts?.reduce((sum, debt) => sum + debt.originalBalance, 0) || 0;
  const totalRemainingBalance = debts?.reduce((sum, debt) => sum + getRemainingBalance(debt), 0) || 0;
  const totalMinPayment = debts?.reduce((sum, debt) => sum + debt.minimumPayment, 0) || 0;
  const totalPaid = debts?.reduce((sum, debt) => sum + getMonthPaymentAmount(debt, monthId), 0) || 0;
  const totalPaidAllTime = debts?.reduce((sum, debt) => sum + getTotalPaidAllTime(debt), 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800 mb-1">Debts Management</h1>
            <p className="text-slate-500 text-sm">Track and manage your debts and payments</p>
          </div>
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="cursor-pointer">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Debt
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Original Balance</p>
            <p className="text-2xl font-semibold text-slate-800">{formatCurrency(totalOriginalBalance)}</p>
            <p className="text-xs text-slate-400 mt-1">{debts?.length || 0} debts</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Remaining Balance</p>
            <p className="text-2xl font-semibold text-blue-700">{formatCurrency(totalRemainingBalance)}</p>
            <p className="text-xs text-slate-400 mt-1">left to pay</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-amber-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Min. Payment</p>
            <p className="text-2xl font-semibold text-amber-700">{formatCurrency(totalMinPayment)}</p>
            <p className="text-xs text-slate-400 mt-1">monthly total</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Paid This Month</p>
            <p className="text-2xl font-semibold text-emerald-700">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-slate-400 mt-1">current month</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Paid</p>
            <p className="text-2xl font-semibold text-teal-700">{formatCurrency(totalPaidAllTime)}</p>
            <p className="text-xs text-slate-400 mt-1">all time</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-700">All Debts</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search debts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                options={[
                  { value: 'all', label: 'All Debts' },
                  { value: 'paid_off', label: 'Paid Off' },
                  { value: 'unpaid', label: 'Unpaid' },
                  { value: 'overdue', label: 'Overdue' },
                ]}
                className="w-full sm:w-48"
              />
            </div>
          </div>

          {!filteredDebts || filteredDebts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchQuery || filterStatus !== 'all' ? 'No debts match your filters' : 'No debts yet'}
              </h3>
              <p className="text-slate-500 mb-6">
                {searchQuery || filterStatus !== 'all' ? 'Try adjusting your search or filters.' : 'Get started by creating your first debt.'}
              </p>
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="shadow-lg cursor-pointer">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Debt
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Type</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Original Balance</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Remaining</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Min. Payment</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Paid This Month</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700 text-sm">Duration/Frequency</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700 text-sm">Payment Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700 text-sm">Progress</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDebts.map((debt) => {
                    const paymentProgress = calculatePaymentProgress(debt);
                    const monthPayment = getMonthPaymentAmount(debt, monthId);
                    const paymentStatus = getMonthPaymentStatus(debt, year, month, monthId);
                    const daysUntil = getDaysUntilPayment(debt, year, month);
                    const nextPayment = getNextPaymentDate(debt, year, month);
                    const totalPaidAllTime = getTotalPaidAllTime(debt);
                    const remainingBalance = getRemainingBalance(debt);

                    return (
                      <tr key={debt._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-medium text-slate-800 text-sm">{debt.name}</td>
                        <td className="py-4 px-4">
                          <CategoryBadge category={debt.type} type="debt" />
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-slate-800 text-sm">{formatCurrency(debt.originalBalance)}</td>
                        <td className="py-4 px-4 text-right font-semibold text-blue-700 text-sm">{formatCurrency(remainingBalance)}</td>
                        <td className="py-4 px-4 text-right font-semibold text-slate-800 text-sm">{formatCurrency(debt.minimumPayment)}</td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-semibold text-emerald-700 text-sm">{formatCurrency(monthPayment)}</span>
                            <span className="text-xs text-slate-400">of {formatCurrency(debt.minimumPayment)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              debt.durationMonths && debt.durationMonths > 1
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {debt.durationMonths || 1} mo.
                            </span>
                            <span className="text-xs text-slate-500">
                              {debt.paymentFrequency === 'monthly' ? 'Monthly' : 'Bi-weekly'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {paymentStatus === 'paid' ? (
                              <>
                                <span className="text-xs font-medium text-emerald-600">Paid</span>
                                <span className="text-xs text-emerald-400">✓</span>
                              </>
                            ) : paymentStatus === 'overdue' ? (
                              <>
                                <span className="text-xs font-medium text-rose-600">Overdue</span>
                                <span className="text-xs text-slate-400">
                                  Due: {formatDate(nextPayment)}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-xs font-medium text-amber-600">{daysUntil} days left</span>
                                <span className="text-xs text-slate-400">
                                  Due: {formatDate(nextPayment)}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${paymentProgress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{Math.round(paymentProgress)}%</p>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPaymentModal(debt)}
                            className="text-emerald-600 cursor-pointer hover:text-emerald-800 hover:bg-emerald-50"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pay
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(debt)}
                            className="text-slate-600 cursor-pointer hover:text-slate-800 hover:bg-slate-100"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDebt(debt._id)}
                            className="text-rose-600 cursor-pointer hover:text-rose-700 hover:bg-rose-50"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </Button>
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

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Debt"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Debt Name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Credit Card"
            required
          />

          <Select
            label="Type"
            value={createType}
            onChange={(e) => setCreateType(e.target.value as DebtType)}
            options={DEBT_TYPES}
          />

          <Input
            label="Balance"
            type="number"
            value={createBalance}
            onChange={(e) => setCreateBalance(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />

          <Input
            label="Minimum Payment"
            type="number"
            value={createMinPayment}
            onChange={(e) => setCreateMinPayment(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />

          <Input
            label="Duration (Months)"
            type="number"
            value={createDurationMonths}
            onChange={(e) => setCreateDurationMonths(e.target.value)}
            placeholder="1"
            min="1"
          />

          <Input
            label="Interest Rate (%)"
            type="number"
            value={createInterestRate}
            onChange={(e) => setCreateInterestRate(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
          />

          <Select
            label="Payment Frequency"
            value={createPaymentFrequency}
            onChange={(e) => setCreatePaymentFrequency(e.target.value as PaymentFrequency)}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'biweekly', label: 'Bi-weekly (1st & 15th)' },
            ]}
          />

          {createPaymentFrequency === 'monthly' && (
            <Input
              label="Payment Due Date (Day of Month)"
              type="number"
              value={createPaymentDueDate}
              onChange={(e) => setCreatePaymentDueDate(e.target.value)}
              placeholder="1"
              min="1"
              max="31"
              required
            />
          )}

          <p className="text-xs text-slate-500">
            This debt will start from {month}/{year} and will be tracked until paid off
          </p>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              variant="primary"
              className='cursor-pointer'
              onClick={handleCreateDebt}
              isLoading={createDebt.isPending}
            >
              Add Debt
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Debt"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Debt Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Credit Card"
            required
          />

          <Select
            label="Type"
            value={editType}
            onChange={(e) => setEditType(e.target.value as DebtType)}
            options={DEBT_TYPES}
          />

          <Input
            label="Original Balance"
            type="number"
            value={editBalance}
            onChange={(e) => setEditBalance(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />

          <Input
            label="Minimum Payment"
            type="number"
            value={editMinPayment}
            onChange={(e) => setEditMinPayment(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />

          <Input
            label="Duration (Months)"
            type="number"
            value={editDurationMonths}
            onChange={(e) => setEditDurationMonths(e.target.value)}
            placeholder="1"
            min="1"
          />

          <Input
            label="Interest Rate (%)"
            type="number"
            value={editInterestRate}
            onChange={(e) => setEditInterestRate(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
          />

          <Select
            label="Payment Frequency"
            value={editPaymentFrequency}
            onChange={(e) => setEditPaymentFrequency(e.target.value as PaymentFrequency)}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'biweekly', label: 'Bi-weekly (1st & 15th)' },
            ]}
          />

          {editPaymentFrequency === 'monthly' && (
            <Input
              label="Payment Due Date (Day of Month)"
              type="number"
              value={editPaymentDueDate}
              onChange={(e) => setEditPaymentDueDate(e.target.value)}
              placeholder="1"
              min="1"
              max="31"
              required
            />
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              variant="primary"
              className='cursor-pointer'
              onClick={handleEditDebt}
              isLoading={updateDebt.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment - ${selectedDebtForPayment?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <p className="text-xs text-slate-500">Original Balance:</p>
              <p className="text-sm font-semibold text-slate-800">
                {selectedDebtForPayment && formatCurrency(selectedDebtForPayment.originalBalance)}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-slate-500">Total Paid (All Time):</p>
              <p className="text-sm font-semibold text-emerald-700">
                {selectedDebtForPayment && formatCurrency(getTotalPaidAllTime(selectedDebtForPayment))}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-slate-500">Remaining Balance:</p>
              <p className="text-sm font-semibold text-blue-700">
                {selectedDebtForPayment && formatCurrency(getRemainingBalance(selectedDebtForPayment))}
              </p>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
              <p className="text-xs text-slate-500">Minimum Payment:</p>
              <p className="text-xl font-semibold text-slate-800">
                {selectedDebtForPayment && formatCurrency(selectedDebtForPayment.minimumPayment)}
              </p>
            </div>
          </div>

          <Input
            label="Payment Amount"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />

          <div className="flex justify-end space-x-3">
            <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRecordPayment}
              isLoading={recordPayment.isPending}
              className="bg-emerald-600 cursor-pointer hover:bg-emerald-700"
            >
              Record Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}