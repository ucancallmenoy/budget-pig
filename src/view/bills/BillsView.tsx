'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { useRecordBillPayment } from '@/hooks/bills/mutations/useRecordBillPayment';
import { Bill, BillCategory, BillRecurrence } from '@/types/bill';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { BILL_CATEGORIES } from '@/utils/constants';
import { getMonthBillPaymentAmount, getBillStatusDisplay } from '@/utils/bill';

interface BillsViewProps {
  monthId: string;
  year: number;
  month: number;
}

export function BillsView({ monthId, year, month }: BillsViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [paymentAmount, setPaymentAmount] = useState('');

  const [createName, setCreateName] = useState('');
  const [createCategory, setCreateCategory] = useState<BillCategory>('utilities');
  const [createAmount, setCreateAmount] = useState('');
  const [createDueDate, setCreateDueDate] = useState('1');
  const [createIsRecurring, setCreateIsRecurring] = useState(false);
  const [createRecurrence, setCreateRecurrence] = useState<BillRecurrence>('one_time');

  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<BillCategory>('utilities');
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('1');
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editRecurrence, setEditRecurrence] = useState<BillRecurrence>('one_time');

  const { data: bills, isLoading } = useBills(monthId);
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const deleteBill = useDeleteBill();
  const recordBillPayment = useRecordBillPayment();

  useEffect(() => {
    if (createIsRecurring && createRecurrence === 'one_time') {
      setCreateRecurrence('monthly');
    } else if (!createIsRecurring) {
      setCreateRecurrence('one_time');
    }
  }, [createIsRecurring, createRecurrence]);

  useEffect(() => {
    if (editIsRecurring && editRecurrence === 'one_time') {
      setEditRecurrence('monthly');
    } else if (!editIsRecurring) {
      setEditRecurrence('one_time');
    }
  }, [editIsRecurring, editRecurrence]);

  const handleCreateBill = async () => {
    const amount = parseFloat(createAmount);
    const dueDate = parseInt(createDueDate);
    
    if (!createName || !createAmount || isNaN(amount) || isNaN(dueDate)) {
      alert('Please fill in all required fields');
      return;
    }

    if (amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    let recurrenceValue: BillRecurrence = 'one_time';
    if (createIsRecurring) {
      recurrenceValue = createRecurrence as BillRecurrence;
    }

    console.log('Creating bill with:', {
      isRecurring: createIsRecurring,
      recurrence: recurrenceValue,
      createRecurrence,
    });

    try {
      await createBill.mutateAsync({
        monthId,
        name: createName,
        category: createCategory,
        amount,
        dueDate,
        isRecurring: createIsRecurring,
        recurrence: recurrenceValue,
      });

      setCreateName('');
      setCreateCategory('utilities');
      setCreateAmount('');
      setCreateDueDate('1');
      setCreateIsRecurring(false);
      setCreateRecurrence('one_time');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('Failed to create bill');
    }
  };

  const handleEditBill = async () => {
    if (!selectedBill) return;

    const amount = parseFloat(editAmount);
    const dueDate = parseInt(editDueDate);
    
    if (!editName || !editAmount || isNaN(amount) || isNaN(dueDate)) {
      alert('Please fill in all required fields');
      return;
    }

    if (amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    let recurrenceValue: BillRecurrence = 'one_time';
    if (editIsRecurring) {
      recurrenceValue = editRecurrence as BillRecurrence;
    }

    try {
      await updateBill.mutateAsync({
        billId: selectedBill._id,
        monthId,
        data: {
          name: editName,
          category: editCategory,
          amount,
          dueDate,
          isRecurring: editIsRecurring,
          recurrence: recurrenceValue,
        },
      });

      setIsEditModalOpen(false);
      setSelectedBill(null);
    } catch (error) {
      console.error('Error updating bill:', error);
      alert('Failed to update bill');
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedBillForPayment) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await recordBillPayment.mutateAsync({
        billId: selectedBillForPayment._id,
        monthId,
        amount,
      });

      setIsPaymentModalOpen(false);
      setSelectedBillForPayment(null);
      setPaymentAmount('');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;
    try {
      await deleteBill.mutateAsync({ billId, monthId });
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('Failed to delete bill');
    }
  };

  const openEditModal = (bill: Bill) => {
    setSelectedBill(bill);
    setEditName(bill.name);
    setEditCategory(bill.category);
    setEditAmount(bill.amount.toString());
    setEditDueDate(bill.dueDate.toString());
    setEditIsRecurring(bill.isRecurring);
    setEditRecurrence(bill.recurrence);
    setIsEditModalOpen(true);
  };

  const openPaymentModal = (bill: Bill) => {
    setSelectedBillForPayment(bill);
    const currentPayment = getMonthBillPaymentAmount(bill, monthId);
    setPaymentAmount(currentPayment > 0 ? currentPayment.toString() : bill.amount.toString());
    setIsPaymentModalOpen(true);
  };

  const filteredBills = useMemo(() => {
    if (!bills) return [];

    let filtered = bills;

    if (searchQuery) {
      filtered = filtered.filter(bill =>
        bill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (filterStatus) {
      case 'paid':
        filtered = filtered.filter(bill => getMonthBillPaymentAmount(bill, monthId) >= bill.amount);
        break;
      case 'unpaid':
        filtered = filtered.filter(bill => getMonthBillPaymentAmount(bill, monthId) < bill.amount);
        break;
      case 'overdue':
        filtered = filtered.filter(bill => {
          const status = getBillStatusDisplay(bill, monthId, year, month);
          return status.status === 'overdue';
        });
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => a.dueDate - b.dueDate);
  }, [bills, searchQuery, filterStatus, monthId, year, month]);

  const totalAmount = bills?.reduce((sum, bill) => sum + bill.amount, 0) || 0;
  const paidAmount = bills?.reduce((sum, bill) => sum + getMonthBillPaymentAmount(bill, monthId), 0) || 0;
  const unpaidAmount = totalAmount - paidAmount;
  const overdueCount = bills?.filter(bill => {
    const status = getBillStatusDisplay(bill, monthId, year, month);
    return status.status === 'overdue';
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800 mb-1">Bills Management</h1>
            <p className="text-slate-500 text-sm">Track and manage your bills across months</p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => setIsCreateModalOpen(true)} 
            className="shadow-lg cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Bill
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            <p className="text-xs text-slate-400 mt-1">this month</p>
          </div>

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
            <p className="text-xs text-slate-400 mt-1">remaining</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-amber-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Overdue</p>
            <p className="text-2xl font-semibold text-amber-700">{overdueCount}</p>
            <p className="text-xs text-slate-400 mt-1">bills overdue</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-base font-semibold text-slate-700">All Bills</h3>
            
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
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Paid</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700 text-sm">Due Date</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700 text-sm">Type</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700 text-sm">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => {
                    const monthPayment = getMonthBillPaymentAmount(bill, monthId);
                    const billStatus = getBillStatusDisplay(bill, monthId, year, month);
                    const nextPayment = new Date(year, month - 1, bill.dueDate);
                    const today = new Date();
                    const daysUntil = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <tr key={bill._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-medium text-slate-800 text-sm">{bill.name}</td>
                        <td className="py-4 px-4">
                          <CategoryBadge category={bill.category} type="bill" />
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-slate-800 text-sm">
                          {formatCurrency(bill.amount)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-emerald-700 text-sm">{formatCurrency(monthPayment)}</span>
                            <span className="text-xs text-slate-400">of {formatCurrency(bill.amount)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {bill.dueDate}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            bill.isRecurring
                              ? bill.recurrence === 'monthly'
                                ? 'bg-blue-100 text-blue-800'
                                : bill.recurrence === 'yearly'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {bill.isRecurring ? (bill.recurrence === 'monthly' ? 'Monthly' : bill.recurrence === 'yearly' ? 'Yearly' : 'One-time') : 'One-time'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center">
                            {billStatus.status === 'paid' ? (
                              <>
                                <span className="text-xs font-medium text-emerald-600">Paid</span>
                                <span className="text-xs text-emerald-400">✓</span>
                              </>
                            ) : billStatus.status === 'overdue' ? (
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
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            {billStatus.status !== 'paid' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openPaymentModal(bill)}
                                className="text-emerald-600 cursor-pointer hover:text-emerald-800 hover:bg-emerald-50"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Pay
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(bill)}
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
                              onClick={() => handleDeleteBill(bill._id)}
                              className="text-rose-600 cursor-pointer hover:text-rose-700 hover:bg-rose-50"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </Button>
                          </div>
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
        title="Add New Bill"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Bill Name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="e.g., Electric Bill"
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
            label="Due Date (Day of Month)"
            type="number"
            value={createDueDate}
            onChange={(e) => setCreateDueDate(e.target.value)}
            placeholder="1"
            min="1"
            max="31"
            required
            helperText="Enter a day between 1-31"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="createIsRecurring"
              checked={createIsRecurring}
              onChange={(e) => setCreateIsRecurring(e.target.checked)}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
            />
            <label htmlFor="createIsRecurring" className="text-sm text-slate-900 cursor-pointer">
              Is this a recurring bill?
            </label>
          </div>

          {createIsRecurring && (
            <Select
              label="Recurrence Type"
              value={createRecurrence}
              onChange={(e) => setCreateRecurrence(e.target.value as BillRecurrence)}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          )}

          <p className="text-xs text-slate-500 bg-blue-50 p-2 rounded">
            {createIsRecurring 
              ? `This bill will automatically appear every ${createRecurrence === 'monthly' ? 'month' : 'year'} on the ${createDueDate}${
                  createDueDate === '1' ? 'st' : 
                  createDueDate === '2' ? 'nd' : 
                  createDueDate === '3' ? 'rd' : 
                  'th'
                }`
              : 'This is a one-time bill for the selected month only'
            }
          </p>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="cursor-pointer"
              onClick={handleCreateBill}
              isLoading={createBill.isPending}
            >
              Add Bill
            </Button>
          </div>
        </div>
      </Modal>

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
            placeholder="e.g., Electric Bill"
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
            label="Due Date (Day of Month)"
            type="number"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            placeholder="1"
            min="1"
            max="31"
            required
            helperText="Enter a day between 1-31"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editIsRecurring"
              checked={editIsRecurring}
              onChange={(e) => setEditIsRecurring(e.target.checked)}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
            />
            <label htmlFor="editIsRecurring" className="text-sm text-slate-900 cursor-pointer">
              Is this a recurring bill?
            </label>
          </div>

          {editIsRecurring && (
            <Select
              label="Recurrence Type"
              value={editRecurrence}
              onChange={(e) => setEditRecurrence(e.target.value as BillRecurrence)}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          )}

          <p className="text-xs text-slate-500 bg-blue-50 p-2 rounded">
            {editIsRecurring 
              ? `This bill will automatically appear every ${editRecurrence === 'monthly' ? 'month' : 'year'} on the ${editDueDate}${
                  editDueDate === '1' ? 'st' : 
                  editDueDate === '2' ? 'nd' : 
                  editDueDate === '3' ? 'rd' : 
                  'th'
                }`
              : 'This is a one-time bill'
            }
          </p>

          <div className="flex justify-end space-x-3 pt-4 border-t">
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

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment - ${selectedBillForPayment?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Bill Amount</p>
            <p className="text-2xl font-bold text-slate-800">
              {selectedBillForPayment && formatCurrency(selectedBillForPayment.amount)}
            </p>
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

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRecordPayment}
              isLoading={recordBillPayment.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Record Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}