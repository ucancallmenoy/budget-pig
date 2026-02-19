'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import ViewModeToggle from '@/components/shared/ViewModeToggle';
import { useTransactions } from '@/hooks/transactions/queries/useTransactions';
import { useCreateTransaction } from '@/hooks/transactions/mutations/useCreateTransaction';
import { useDeleteTransaction } from '@/hooks/transactions/mutations/useDeleteTransaction';
import { formatCurrency } from '@/utils/currency';
import { formatDate, getMonthName } from '@/utils/date';
import { getPeriodForDay, getLastDayOfMonth, type ViewMode } from '@/utils/period';

interface BudgetViewProps {
  monthId: string;
  year: number;
  month: number;
}

function getDefaultDateForMonth(year: number, month: number): string {
  const now = new Date();
  const inCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  if (inCurrentMonth) return now.toISOString().split('T')[0];
  return new Date(year, month - 1, 1).toISOString().split('T')[0];
}

export function BudgetView({ monthId, year, month }: BudgetViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => getDefaultDateForMonth(year, month));
  const [note, setNote] = useState('');

  const { data: allIncomeEntries, isLoading: isEntriesLoading } = useTransactions({
    year,
    month,
    type: 'income',
  });
  const { data: filteredIncomeEntries } = useTransactions({
    year,
    month,
    type: 'income',
    period: viewMode === 'monthly' ? undefined : viewMode,
  });
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const minDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const maxDate = `${year}-${String(month).padStart(2, '0')}-${String(getLastDayOfMonth(year, month)).padStart(2, '0')}`;

  const monthlyTotal = useMemo(
    () => (allIncomeEntries || []).reduce((sum, tx) => sum + tx.amount, 0),
    [allIncomeEntries],
  );
  const viewTotal = useMemo(
    () => (filteredIncomeEntries || []).reduce((sum, tx) => sum + tx.amount, 0),
    [filteredIncomeEntries],
  );

  const handleCreateEntry = async () => {
    const parsedAmount = parseFloat(amount);
    if (!source.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0 || !date) {
      return;
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return;

    await createTransaction.mutateAsync({
      type: 'income',
      direction: 'in',
      amount: parsedAmount,
      date: parsedDate,
      year,
      month,
      period: getPeriodForDay(parsedDate.getDate()),
      monthId,
      description: source.trim(),
      note: note.trim() || undefined,
    });

    setSource('');
    setAmount('');
    setDate(getDefaultDateForMonth(year, month));
    setNote('');
    setIsCreateModalOpen(false);
  };

  const handleDeleteEntry = async () => {
    if (!deleteTargetId) return;

    await deleteTransaction.mutateAsync({
      transactionId: deleteTargetId,
      year,
      month,
    });

    setDeleteTargetId(null);
  };

  if (isEntriesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  const entries = filteredIncomeEntries || [];

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800 mb-1">
              Budget Entries - {getMonthName(month)} {year}
            </h1>
            <p className="text-slate-500 text-sm">
              Track where your budget/income came from (payday, bonus, gifts, and more)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Add Budget
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Monthly Budget</p>
            <p className="text-2xl font-semibold text-slate-800">{formatCurrency(monthlyTotal)}</p>
            <p className="text-xs text-slate-400 mt-1">All income entries for this month</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              {viewMode === 'monthly' ? 'Current View' : `${viewMode} Total`}
            </p>
            <p className="text-2xl font-semibold text-emerald-700">{formatCurrency(viewTotal)}</p>
            <p className="text-xs text-slate-400 mt-1">
              {viewMode === 'monthly' ? 'Full month total' : `Income entries in ${viewMode}`}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Entries</p>
            <p className="text-2xl font-semibold text-slate-800">{entries.length}</p>
            <p className="text-xs text-slate-400 mt-1">
              {viewMode === 'monthly' ? 'In this month' : `In ${viewMode}`}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-700 mb-4">Budget Transactions</h3>

          {entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-6">
                No budget entries yet for this {viewMode === 'monthly' ? 'month' : 'period'}.
              </p>
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                Add Budget
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Source</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Period</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Note</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700 text-sm">Amount</th>
                    <th className="w-28 text-right py-3 px-4 font-semibold text-slate-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-700">{formatDate(entry.date)}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-800">{entry.description}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">{entry.period}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{entry.note || '-'}</td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-emerald-700">
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="w-28 py-3 px-4">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => setDeleteTargetId(entry._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Budget Entry"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g., Company Payroll, Bonus, Gift from Mom"
            required
          />

          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={minDate}
            max={maxDate}
            required
          />

          <Input
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
          />

          <Input
            label="Note (Optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any additional details"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateEntry}
              isLoading={createTransaction.isPending}
            >
              Add Budget
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Budget Entry"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Delete this budget entry from the month?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setDeleteTargetId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteEntry}
              isLoading={deleteTransaction.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
