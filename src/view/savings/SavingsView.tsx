'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { useSavings } from '@/hooks/savings/queries/useSavings';
import { useCreateSaving } from '@/hooks/savings/mutations/useCreateSaving';
import { useUpdateSaving } from '@/hooks/savings/mutations/useUpdateSaving';
import { useDeleteSaving } from '@/hooks/savings/mutations/useDeleteSaving';
import { useAddContribution } from '@/hooks/savings/mutations/useAddContribution';
import { Saving } from '@/types/saving';
import { formatCurrency } from '@/utils/currency';
import { formatDate, getDaysUntil } from '@/utils/date';
import { ContributionModal } from '@/components/shared/ContributionModal';

interface SavingsViewProps {
  monthId: string;
  year: number;
  month: number;
}

const SAVING_CATEGORIES = [
  { value: 'emergency', label: 'Emergency Fund' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'home', label: 'Home/Property' },
  { value: 'education', label: 'Education' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'other', label: 'Other' },
];

export function SavingsView({ monthId, year, month }: SavingsViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'monthly' | 'long_term'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [createName, setCreateName] = useState('');
  const [createTarget, setCreateTarget] = useState('');
  const [createSaved, setCreateSaved] = useState('');
  const [createGoalType, setCreateGoalType] = useState<'monthly' | 'long_term'>('monthly');
  const [createTargetDate, setCreateTargetDate] = useState('');
  const [createCategory, setCreateCategory] = useState('');

  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editSaved, setEditSaved] = useState('');
  const [editGoalType, setEditGoalType] = useState<'monthly' | 'long_term'>('monthly');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const { data: allSavings, isLoading } = useSavings(monthId);
  const createSaving = useCreateSaving();
  const updateSaving = useUpdateSaving();
  const deleteSaving = useDeleteSaving();
  const addContribution = useAddContribution();

  const handleCreateSaving = async () => {
    const target = parseFloat(createTarget);
    const saved = parseFloat(createSaved) || 0;

    if (!createName || !createTarget || isNaN(target)) return;

    await createSaving.mutateAsync({
      monthId: createGoalType === 'monthly' ? monthId : undefined,
      name: createName,
      targetAmount: target,
      savedAmount: saved,
      goalType: createGoalType,
      targetDate: createTargetDate ? new Date(createTargetDate) : undefined,
      category: createCategory || undefined,
    });

    setCreateName('');
    setCreateTarget('');
    setCreateSaved('');
    setCreateGoalType('monthly');
    setCreateTargetDate('');
    setCreateCategory('');
    setIsCreateModalOpen(false);
  };

  const handleEditSaving = async () => {
    if (!selectedSaving) return;

    const target = parseFloat(editTarget);
    const saved = parseFloat(editSaved);

    if (!editName || !editTarget || isNaN(target) || isNaN(saved)) return;

    await updateSaving.mutateAsync({
      savingId: selectedSaving._id,
      monthId,
      data: {
        name: editName,
        targetAmount: target,
        savedAmount: saved,
        goalType: editGoalType,
        targetDate: editTargetDate ? new Date(editTargetDate) : undefined,
        category: editCategory || undefined,
      },
    });

    setIsEditModalOpen(false);
    setSelectedSaving(null);
  };

  const handleDeleteSaving = async (savingId: string) => {
    if (!confirm('Are you sure you want to delete this savings goal?')) return;

    await deleteSaving.mutateAsync({ savingId, monthId });
  };

  const handleAddContribution = async (amount: number, note: string) => {
    if (!selectedSaving) return;

    await addContribution.mutateAsync({
      savingId: selectedSaving._id,
      monthId,
      amount,
      note,
    });
  };

  const openEditModal = (saving: Saving) => {
    setSelectedSaving(saving);
    setEditName(saving.name);
    setEditTarget(saving.targetAmount.toString());
    setEditSaved(saving.savedAmount.toString());
    setEditGoalType(saving.goalType);
    setEditTargetDate(saving.targetDate ? new Date(saving.targetDate).toISOString().split('T')[0] : '');
    setEditCategory(saving.category || '');
    setIsEditModalOpen(true);
  };

  const openContributionModal = (saving: Saving) => {
    setSelectedSaving(saving);
    setIsContributionModalOpen(true);
  };

  const filteredSavings = useMemo(() => {
    if (!allSavings) return [];

    let filtered = allSavings;

    if (activeTab !== 'all') {
      filtered = filtered.filter(saving => saving.goalType === activeTab);
    }

    if (searchQuery) {
      filtered = filtered.filter(saving =>
        saving.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        saving.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(saving => saving.category === filterCategory);
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [allSavings, activeTab, searchQuery, filterCategory]);

  const totalTarget = filteredSavings.reduce((sum, saving) => sum + saving.targetAmount, 0);
  const totalSaved = filteredSavings.reduce((sum, saving) => sum + saving.savedAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const completedGoals = filteredSavings.filter(s => s.isCompleted).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800 mb-1">
              Savings Goals
            </h1>
            <p className="text-slate-500 text-sm">Track and achieve your financial goals</p>
          </div>
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="shadow-lg cursor-pointer">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Goal
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Target</p>
            <p className="text-2xl font-semibold text-slate-800">{formatCurrency(totalTarget)}</p>
            <p className="text-xs text-slate-400 mt-1">{filteredSavings.length} goals</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Saved</p>
            <p className="text-2xl font-semibold text-emerald-700">{formatCurrency(totalSaved)}</p>
            <p className="text-xs text-slate-400 mt-1">this period</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <ProgressRing progress={overallProgress} size={40} strokeWidth={4} color="#3b82f6" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Overall Progress</p>
            <p className="text-2xl font-semibold text-blue-700">{overallProgress.toFixed(0)}%</p>
            <p className="text-xs text-slate-400 mt-1">completion rate</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-purple-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Goals Completed</p>
            <p className="text-2xl font-semibold text-purple-700">{completedGoals}</p>
            <p className="text-xs text-slate-400 mt-1">out of {filteredSavings.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex space-x-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-2 rounded-md font-medium cursor-pointer transition-colors text-sm w-32 ${
                  activeTab === 'all'
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Goals ({allSavings?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                className={`px-3 py-2 rounded-md font-medium cursor-pointer transition-colors text-sm w-32 ${
                  activeTab === 'monthly'
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly ({allSavings?.filter(s => s.goalType === 'monthly').length || 0})
              </button>
              <button
                onClick={() => setActiveTab('long_term')}
                className={`px-3 py-2 rounded-md font-medium cursor-pointer transition-colors text-sm w-32 ${
                  activeTab === 'long_term'
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Long-term ({allSavings?.filter(s => s.goalType === 'long_term').length || 0})
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...SAVING_CATEGORIES,
                ]}
                className="w-full sm:w-48"
              />
            </div>
          </div>

          {filteredSavings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchQuery || filterCategory !== 'all' ? 'No goals match your filters' : 'No savings goals yet'}
              </h3>
              <p className="text-slate-500 mb-6">
                {searchQuery || filterCategory !== 'all' ? 'Try adjusting your search or filters.' : 'Get started by creating your first savings goal.'}
              </p>
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className='cursor-pointer'>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Goal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSavings.map((saving) => {
                const progress = (saving.savedAmount / saving.targetAmount) * 100;
                const remaining = saving.targetAmount - saving.savedAmount;
                const isComplete = saving.isCompleted;
                const daysRemaining = saving.targetDate ? getDaysUntil(saving.targetDate) : null;

                return (
                  <div key={saving._id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-slate-800">{saving.name}</h3>
                          {isComplete && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              ✓ Complete
                            </span>
                          )}
                        </div>
                        {saving.category && (
                          <p className="text-xs text-slate-500">{saving.category}</p>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        saving.goalType === 'monthly'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {saving.goalType === 'monthly' ? 'Monthly' : 'Long-term'}
                      </span>
                    </div>

                    <div className="flex justify-center mb-4">
                      <ProgressRing
                        progress={progress}
                        size={80}
                        color={isComplete ? '#10b981' : '#3b82f6'}
                        label="Progress"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Target</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatCurrency(saving.targetAmount)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-emerald-600">Saved</p>
                        <p className="text-sm font-semibold text-emerald-700">
                          {formatCurrency(saving.savedAmount)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Remaining</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatCurrency(Math.max(remaining, 0))}
                        </p>
                      </div>
                    </div>

                    {saving.targetDate && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-blue-600 font-medium">Target Date</p>
                            <p className="text-sm font-semibold text-blue-900">
                              {formatDate(saving.targetDate)}
                            </p>
                          </div>
                          {!isComplete && daysRemaining !== null && (
                            <span className={`text-xs font-medium ${
                              daysRemaining < 0 ? 'text-rose-600' : 'text-blue-600'
                            }`}>
                              {daysRemaining < 0
                                ? `${Math.abs(daysRemaining)} days overdue`
                                : `${daysRemaining} days left`
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {!isComplete && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openContributionModal(saving)}
                          className="flex-1 cursor-pointer"
                        >
                          + Add Contribution
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(saving)}
                        className="text-slate-600 cursor-pointer hover:text-slate-800 hover:bg-slate-100"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSaving(saving._id)}
                        className="text-rose-600 cursor-pointer hover:text-rose-700 hover:bg-rose-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Savings Goal"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Goal Name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="e.g., Emergency Fund"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Goal Type"
              value={createGoalType}
              onChange={(e) => setCreateGoalType(e.target.value as 'monthly' | 'long_term')}
              options={[
                { value: 'monthly', label: 'Monthly Goal' },
                { value: 'long_term', label: 'Long-term Goal' },
              ]}
            />

            <Select
              label="Category"
              value={createCategory}
              onChange={(e) => setCreateCategory(e.target.value)}
              options={SAVING_CATEGORIES}
              placeholder="Select category"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Amount"
              type="number"
              value={createTarget}
              onChange={(e) => setCreateTarget(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />

            <Input
              label="Starting Amount (Optional)"
              type="number"
              value={createSaved}
              onChange={(e) => setCreateSaved(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          {createGoalType === 'long_term' && (
            <Input
              label="Target Date (Optional)"
              type="date"
              value={createTargetDate}
              onChange={(e) => setCreateTargetDate(e.target.value)}
            />
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSaving}
              isLoading={createSaving.isPending}
            >
              Add Goal
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Savings Goal"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Goal Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Emergency Fund"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Goal Type"
              value={editGoalType}
              onChange={(e) => setEditGoalType(e.target.value as 'monthly' | 'long_term')}
              options={[
                { value: 'monthly', label: 'Monthly Goal' },
                { value: 'long_term', label: 'Long-term Goal' },
              ]}
            />

            <Select
              label="Category"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              options={SAVING_CATEGORIES}
              placeholder="Select category"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Amount"
              type="number"
              value={editTarget}
              onChange={(e) => setEditTarget(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />

            <Input
              label="Current Saved Amount"
              type="number"
              value={editSaved}
              onChange={(e) => setEditSaved(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          {editGoalType === 'long_term' && (
            <Input
              label="Target Date (Optional)"
              type="date"
              value={editTargetDate}
              onChange={(e) => setEditTargetDate(e.target.value)}
            />
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditSaving}
              isLoading={updateSaving.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      <ContributionModal
        isOpen={isContributionModalOpen}
        onClose={() => {
          setIsContributionModalOpen(false);
          setSelectedSaving(null);
        }}
        saving={selectedSaving}
        onSubmit={handleAddContribution}
        isLoading={addContribution.isPending}
      />
    </div>
  );
}