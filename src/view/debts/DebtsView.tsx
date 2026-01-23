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
import { Debt, DebtType } from '@/types/debt';
import { formatCurrency } from '@/utils/currency';
import { DEBT_TYPES } from '@/utils/constants';

interface DebtsViewProps {
  monthId: string;
  year: number;
  month: number;
}

export function DebtsView({ monthId, year, month }: DebtsViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid_off' | 'unpaid' | 'overdue'>('all');

  // Form states for create
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState<DebtType>('credit_card');
  const [createBalance, setCreateBalance] = useState('');
  const [createMinPayment, setCreateMinPayment] = useState('');
  const [createPaidAmount, setCreatePaidAmount] = useState('');

  // Form states for edit
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<DebtType>('credit_card');
  const [editBalance, setEditBalance] = useState('');
  const [editMinPayment, setEditMinPayment] = useState('');
  const [editPaidAmount, setEditPaidAmount] = useState('');

  const { data: debts, isLoading } = useDebts(monthId);
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();
  const deleteDebt = useDeleteDebt();

  const handleCreateDebt = async () => {
    const balance = parseFloat(createBalance);
    const minPayment = parseFloat(createMinPayment);
    const paidAmount = parseFloat(createPaidAmount) || 0;

    if (!createName || !createBalance || !createMinPayment || isNaN(balance) || isNaN(minPayment)) return;

    await createDebt.mutateAsync({
      monthId,
      name: createName,
      type: createType,
      balance,
      minimumPayment: minPayment,
      paidAmount,
    });

    // Reset form
    setCreateName('');
    setCreateType('credit_card');
    setCreateBalance('');
    setCreateMinPayment('');
    setCreatePaidAmount('');
    setIsCreateModalOpen(false);
  };

  const handleEditDebt = async () => {
    if (!selectedDebt) return;

    const balance = parseFloat(editBalance);
    const minPayment = parseFloat(editMinPayment);
    const paidAmount = parseFloat(editPaidAmount);

    if (!editName || !editBalance || !editMinPayment || isNaN(balance) || isNaN(minPayment)) return;

    await updateDebt.mutateAsync({
      debtId: selectedDebt._id,
      monthId,
      data: {
        name: editName,
        type: editType,
        balance,
        minimumPayment: minPayment,
        paidAmount,
      },
    });

    setIsEditModalOpen(false);
    setSelectedDebt(null);
  };

  const handleDeleteDebt = async (debtId: string) => {
    if (!confirm('Are you sure you want to delete this debt?')) return;

    await deleteDebt.mutateAsync({ debtId, monthId });
  };

  const openEditModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setEditName(debt.name);
    setEditType(debt.type);
    setEditBalance(debt.balance.toString());
    setEditMinPayment(debt.minimumPayment.toString());
    setEditPaidAmount(debt.paidAmount.toString());
    setIsEditModalOpen(true);
  };

  // Filtered and searched debts
  const filteredDebts = useMemo(() => {
    if (!debts) return [];

    let filtered = debts;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(debt =>
        debt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        debt.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    switch (filterStatus) {
      case 'paid_off':
        filtered = filtered.filter(debt => debt.paidAmount >= debt.minimumPayment);
        break;
      case 'unpaid':
        filtered = filtered.filter(debt => debt.paidAmount < debt.minimumPayment);
        break;
      case 'overdue':
        // Assuming overdue if paidAmount is 0 and minimumPayment > 0, but adjust logic as needed
        filtered = filtered.filter(debt => debt.paidAmount === 0 && debt.minimumPayment > 0);
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [debts, searchQuery, filterStatus]);

  const totalBalance = debts?.reduce((sum, debt) => sum + debt.balance, 0) || 0;
  const totalMinPayment = debts?.reduce((sum, debt) => sum + debt.minimumPayment, 0) || 0;
  const totalPaid = debts?.reduce((sum, debt) => sum + debt.paidAmount, 0) || 0;
  const remainingBalance = totalBalance - totalPaid;

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800 mb-1">
              Debts Management
            </h1>
            <p className="text-slate-500 text-sm">Track and manage your monthly debts and payments</p>
          </div>
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="shadow-lg">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Debt
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Total Balance */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Balance</p>
            <p className="text-2xl font-semibold text-slate-800">{formatCurrency(totalBalance)}</p>
            <p className="text-xs text-slate-400 mt-1">{debts?.length || 0} debts</p>
          </div>

          {/* Minimum Payment */}
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

          {/* Amount Paid */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Amount Paid</p>
            <p className="text-2xl font-semibold text-emerald-700">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-slate-400 mt-1">this month</p>
          </div>

          {/* Remaining Balance */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-rose-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Remaining</p>
            <p className="text-2xl font-semibold text-rose-700">{formatCurrency(remainingBalance)}</p>
            <p className="text-xs text-slate-400 mt-1">to pay off</p>
          </div>
        </div>

        {/* Debts List */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-700">All Debts</h3>
            
            {/* Search and Filter */}
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
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
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
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Balance</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Min. Payment</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Paid</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700 text-sm">Progress</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDebts.map((debt) => {
                    const paymentProgress = (debt.paidAmount / debt.minimumPayment) * 100;
                    const isPaidOff = debt.paidAmount >= debt.minimumPayment;

                    return (
                      <tr key={debt._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-medium text-slate-800 text-sm">{debt.name}</td>
                        <td className="py-4 px-4">
                          <CategoryBadge category={debt.type} type="debt" />
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-slate-800 text-sm">{formatCurrency(debt.balance)}</td>
                        <td className="py-4 px-4 text-right font-semibold text-slate-800 text-sm">{formatCurrency(debt.minimumPayment)}</td>
                        <td className="py-4 px-4 text-right font-semibold text-emerald-700 text-sm">{formatCurrency(debt.paidAmount)}</td>
                        <td className="py-4 px-4 text-center">
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${isPaidOff ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{Math.round(paymentProgress)}%</p>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(debt)}
                            className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
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
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
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

      {/* Create Debt Modal */}
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
            label="Amount Paid (Optional)"
            type="number"
            value={createPaidAmount}
            onChange={(e) => setCreatePaidAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateDebt}
              isLoading={createDebt.isPending}
            >
              Add Debt
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Debt Modal */}
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
            label="Balance"
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
            label="Amount Paid"
            type="number"
            value={editPaidAmount}
            onChange={(e) => setEditPaidAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditDebt}
              isLoading={updateDebt.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}