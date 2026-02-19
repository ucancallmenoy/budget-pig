'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const variantClasses: Record<string, string> = {
  danger: 'bg-rose-600 hover:bg-rose-700 text-white',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  info: 'bg-blue-600 hover:bg-blue-700 text-white',
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            isLoading={isLoading}
            className={`cursor-pointer ${variantClasses[variant]}`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
