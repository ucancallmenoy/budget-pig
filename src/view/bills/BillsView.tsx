'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { CategoryBadge } from '@/components/shared/CategoryBadge';
import { useBills } from '@/hooks/bills/queries/useBills';
import { useCreateBill } from '@/hooks/bills/mutations/useCreateBill';
import { useUpdateBill } from '@/hooks/bills/mutations/useUpdateBill';
import { useDeleteBill } from '@/hooks/bills/mutations/useDeleteBill';
import { Bill, BillCategory } from '@/types/bill';
import { formatCurrency } from '@/utils/currency';
import { formatDate, isOverdue, getDaysUntil } from '@/utils/date';
import { BILL_CATEGORIES } from '@/utils/constants';

interface BillsViewProps {
  monthId: string;
  year: number;
  month: number;
}

export function BillsView({ monthId, year, month }: BillsViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid' | 'due_this_week' | 'overdue'>('all');

  // Form states for create
  const [createName, setCreateName] = useState('');
  const [createCategory, setCreateCategory] = useState<BillCategory>('utilities');
  const [createAmount, setCreateAmount] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');

  // Form states for edit
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<BillCategory>('utilities');
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editIsPaid, setEditIsPaid] = useState(false);

  const { data: bills, isLoading } = useBills(monthId);
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const deleteBill = useDeleteBill();

  const handleCreateBill = async () => {
    const amount = parseFloat(createAmount);
    if (!createName || !createAmount || !createDueDate || isNaN(amount)) return;

    await createBill.mutateAsync({
      monthId,
      name: createName,
      category: createCategory,
      amount,
      dueDate: new Date(createDueDate),
    });

    // Reset form
    setCreateName('');
    setCreateCategory('utilities');
    setCreateAmount('');
    setCreateDueDate('');
    setIsCreateModalOpen(false);
  };

  const handleEditBill = async () => {
    if (!selectedBill) return;

    const amount = parseFloat(editAmount);
    if (!editName || !editAmount || !editDueDate || isNaN(amount)) return;

    await updateBill.mutateAsync({
      billId: selectedBill._id,
      monthId,
      data: {
        name: editName,
        category: editCategory,
        amount,
        dueDate: new Date(editDueDate),
        isPaid: editIsPaid,
      },
    });

    setIsEditModalOpen(false);
    setSelectedBill(null);
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    await deleteBill.mutateAsync({ billId, monthId });
  };

  const handleTogglePaid = async (bill: Bill) => {
    await updateBill.mutateAsync({
      billId: bill._id,
      monthId,
      data: { isPaid: !bill.isPaid },
    });
  };

  const openEditModal = (bill: Bill) => {
    setSelectedBill(bill);
    setEditName(bill.name);
    setEditCategory(bill.category);
    setEditAmount(bill.amount.toString());
    setEditDueDate(new Date(bill.dueDate).toISOString().split('T')[0]);
    setEditIsPaid(bill.isPaid);
    setIsEditModalOpen(true);
  };

  // Filtered and searched bills
  const filteredBills = useMemo(() => {
    if (!bills) return [];

    let filtered = bills;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(bill =>
        bill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    switch (filterStatus) {
      case 'paid':
        filtered = filtered.filter(bill => bill.isPaid);
        break;
      case 'unpaid':
        filtered = filtered.filter(bill => !bill.isPaid);
        break;
      case 'due_this_week':
        filtered = filtered.filter(bill => {
          const daysUntil = getDaysUntil(bill.dueDate);
          return daysUntil >= 0 && daysUntil <= 7 && !bill.isPaid;
        });
        break;
      case 'overdue':
        filtered = filtered.filter(bill => isOverdue(bill.dueDate) && !bill.isPaid);
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [bills, searchQuery, filterStatus]);

  const totalAmount = bills?.reduce((sum, bill) => sum + bill.amount, 0) || 0;
  const paidAmount = bills?.filter(b => b.isPaid).reduce((sum, bill) => sum + bill.amount, 0) || 0;
  const unpaidAmount = totalAmount - paidAmount;

  // Calculate due this week count
  const dueThisWeekCount = bills?.filter(bill => {
    const daysUntil = getDaysUntil(bill.dueDate);
    return daysUntil >= 0 && daysUntil <= 7 && !bill.isPaid;
  }).length || 0;

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
              Bills Management
            </h1>
            <p className="text-slate-500 text-sm">Track and manage your monthly bills and payments</p>
          </div>
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="shadow-lg">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Bill
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Total Bills */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Bills</p>
            <p className="text-2xl font-semibold text-slate-800">{formatCurrency(totalAmount)}</p>
            <p className="text-xs text-slate-400 mt-1">{bills?.length || 0} bills</p>
          </div>

          {/* Paid */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Paid</p>
            <p className="text-2xl font-semibold text-emerald-700">{formatCurrency(paidAmount)}</p>
            <p className="text-xs text-slate-400 mt-1">{bills?.filter(b => b.isPaid).length || 0} bills</p>
          </div>

          {/* Unpaid */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-rose-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Unpaid</p>
            <p className="text-2xl font-semibold text-rose-700">{formatCurrency(unpaidAmount)}</p>
            <p className="text-xs text-slate-400 mt-1">{bills?.filter(b => !b.isPaid).length || 0} bills</p>
          </div>

          {/* Due This Week */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-amber-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Due This Week</p>
            <p className="text-2xl font-semibold text-amber-700">{dueThisWeekCount}</p>
            <p className="text-xs text-slate-400 mt-1">bills due soon</p>
          </div>
        </div>

        {/* Bills List */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-base font-semibold text-slate-700">All Bills</h3>
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search bills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                options={[
                  { value: 'all', label: 'All Bills' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'unpaid', label: 'Unpaid' },
                  { value: 'due_this_week', label: 'Due This Week' },
                  { value: 'overdue', label: 'Overdue' },
                ]}
                className="w-full sm:w-48"
              />
            </div>
          </div>

          {!filteredBills || filteredBills.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchQuery || filterStatus !== 'all' ? 'No bills match your filters' : 'No bills yet'}
              </h3>
              <p className="text-slate-500 mb-6">
                {searchQuery || filterStatus !== 'all' ? 'Try adjusting your search or filters.' : 'Get started by creating your first bill.'}
              </p>
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Bill
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Category</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Due Date</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700 text-sm">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => {
                    const overdue = !bill.isPaid && isOverdue(bill.dueDate);
                    const daysUntil = getDaysUntil(bill.dueDate);

                    return (
                      <tr key={bill._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-medium text-slate-800 text-sm">{bill.name}</td>
                        <td className="py-4 px-4">
                          <CategoryBadge category={bill.category} type="bill" />
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-slate-800 text-sm">{formatCurrency(bill.amount)}</td>
                        <td className="py-4 px-4">
                          <div>
                            <p className={`font-medium text-sm ${overdue ? 'text-rose-600' : 'text-slate-800'}`}>
                              {formatDate(bill.dueDate)}
                            </p>
                            {!bill.isPaid && (
                              <p className={`text-xs ${overdue ? 'text-rose-500' : 'text-slate-500'}`}>
                                {overdue ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days left`}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleTogglePaid(bill)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              bill.isPaid
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            }`}
                          >
                            {bill.isPaid ? 'Paid' : 'Unpaid'}
                          </button>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(bill)}
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
                            onClick={() => handleDeleteBill(bill._id)}
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

      {/* Create Bill Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Bill"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Bill Name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Electric Bill"
            required
          />

          <Select
            label="Category"
            value={createCategory}
            onChange={(e) => setCreateCategory(e.target.value as BillCategory)}
            options={BILL_CATEGORIES}
          />

          <Input
            label="Amount"
            type="number"
            value={createAmount}
            onChange={(e) => setCreateAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />

          <Input
            label="Due Date"
            type="date"
            value={createDueDate}
            onChange={(e) => setCreateDueDate(e.target.value)}
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateBill}
              isLoading={createBill.isPending}
            >
              Add Bill
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Bill Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Bill"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Bill Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Electric Bill"
            required
          />

          <Select
            label="Category"
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value as BillCategory)}
            options={BILL_CATEGORIES}
          />

          <Input
            label="Amount"
            type="number"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />

          <Input
            label="Due Date"
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            required
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPaid"
              checked={editIsPaid}
              onChange={(e) => setEditIsPaid(e.target.checked)}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
            />
            <label htmlFor="isPaid" className="ml-2 block text-sm text-slate-900">
              Mark as paid
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditBill}
              isLoading={updateBill.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}