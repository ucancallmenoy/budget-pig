import React from 'react';
import { BillCategory } from '@/types/bill';
import { DebtType } from '@/types/debt';

interface CategoryBadgeProps {
  category: BillCategory | DebtType;
  type: 'bill' | 'debt';
}

export function CategoryBadge({ category, type }: CategoryBadgeProps) {
  const billColors: Record<BillCategory, string> = {
    utilities: 'bg-sky-100 text-sky-700',
    rent: 'bg-purple-100 text-purple-700',
    insurance: 'bg-emerald-100 text-emerald-700',
    subscription: 'bg-amber-100 text-amber-700',
    loan: 'bg-rose-100 text-rose-700',
    other: 'bg-gray-100 text-gray-700',
  };

  const debtColors: Record<DebtType, string> = {
    credit_card: 'bg-rose-100 text-rose-700',
    student_loan: 'bg-sky-100 text-sky-700',
    personal_loan: 'bg-amber-100 text-amber-700',
    mortgage: 'bg-purple-100 text-purple-700',
    car_loan: 'bg-emerald-100 text-emerald-700',
    other: 'bg-gray-100 text-gray-700',
  };

  const colors = type === 'bill' ? billColors[category as BillCategory] : debtColors[category as DebtType];
  const label = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${colors}`}>
      {label}
    </span>
  );
}