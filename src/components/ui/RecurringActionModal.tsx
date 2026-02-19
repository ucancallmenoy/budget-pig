'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export type RecurringAction = 'this_period' | 'this_and_future';

export interface RecurringActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (action: RecurringAction) => void;
  title?: string;
  description?: string;
  actionType: 'edit' | 'delete';
  isLoading?: boolean;
}

export function RecurringActionModal({
  isOpen,
  onClose,
  onSelect,
  title,
  description,
  actionType,
  isLoading = false,
}: RecurringActionModalProps) {
  const [selected, setSelected] = useState<RecurringAction>('this_period');

  const defaultTitle =
    actionType === 'edit' ? 'Edit Recurring Bill' : 'Delete Recurring Bill';
  const defaultDescription =
    actionType === 'edit'
      ? 'How would you like to apply this change?'
      : 'How would you like to delete this recurring bill?';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title ?? defaultTitle} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{description ?? defaultDescription}</p>

        <div className="space-y-2">
          <label
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              selected === 'this_period'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="recurringAction"
              value="this_period"
              checked={selected === 'this_period'}
              onChange={() => setSelected('this_period')}
              className="text-emerald-600"
            />
            <div>
              <p className="text-sm font-medium text-slate-800">This period only</p>
              <p className="text-xs text-slate-500">
                {actionType === 'edit'
                  ? 'Changes apply only to the current period/month'
                  : 'Remove only from the current period/month'}
              </p>
            </div>
          </label>

          <label
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              selected === 'this_and_future'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="recurringAction"
              value="this_and_future"
              checked={selected === 'this_and_future'}
              onChange={() => setSelected('this_and_future')}
              className="text-emerald-600"
            />
            <div>
              <p className="text-sm font-medium text-slate-800">This and future periods</p>
              <p className="text-xs text-slate-500">
                {actionType === 'edit'
                  ? 'Changes apply from now on for all future periods'
                  : 'Remove from current and all future periods'}
              </p>
            </div>
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onSelect(selected)}
            isLoading={isLoading}
            className={`cursor-pointer ${
              actionType === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : ''
            }`}
          >
            {actionType === 'edit' ? 'Apply Changes' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
