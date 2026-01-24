'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Saving } from '@/types/saving';
import { formatCurrency } from '@/utils/currency';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  saving: Saving | null;
  onSubmit: (amount: number, note: string) => Promise<void>;
  isLoading: boolean;
}

export function ContributionModal({
  isOpen,
  onClose,
  saving,
  onSubmit,
  isLoading,
}: ContributionModalProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = async () => {
    const contributionAmount = parseFloat(amount);
    if (isNaN(contributionAmount) || contributionAmount <= 0) return;

    try {
      await onSubmit(contributionAmount, note);
      setAmount('');
      setNote('');
      onClose();
    } catch (error) {
      console.error('Error adding contribution:', error);
    }
  };

  if (!saving) return null;

  const remaining = saving.targetAmount - saving.savedAmount;
  const progress = (saving.savedAmount / saving.targetAmount) * 100;

  const quickAmounts = [
    { label: formatCurrency(500), value: 500 },
    { label: formatCurrency(1000), value: 1000 },
    { label: formatCurrency(2000), value: 2000 },
    { label: 'All', value: remaining },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Contribution" size="md">
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-3">{saving.name}</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Saved</span>
              <span className="font-medium text-gray-800">{formatCurrency(saving.savedAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Target</span>
              <span className="font-medium text-gray-800">{formatCurrency(saving.targetAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Remaining</span>
              <span className="font-medium text-emerald-600">{formatCurrency(remaining)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-emerald-500 h-2 rounded-full"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <Input
          label="Contribution Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0.01"
          max={remaining.toString()}
          required
        />

        <div>
          <p className="text-sm text-gray-600 mb-2">Quick amounts:</p>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((qa) => (
              <button
                key={qa.label}
                type="button"
                onClick={() => setAmount(qa.value.toString())}
                className="px-3 py-2 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={qa.value > remaining || isLoading}
              >
                {qa.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Note (Optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g., Weekly savings"
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!amount || parseFloat(amount) <= 0 || isLoading}
          >
            Add Contribution
          </Button>
        </div>
      </div>
    </Modal>
  );
}