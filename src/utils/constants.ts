import { BillCategory } from '@/types/bill';
import { DebtType } from '@/types/debt';
import type { ViewMode } from '@/utils/period';

export const BILL_CATEGORIES: { value: BillCategory; label: string }[] = [
  { value: 'utilities', label: 'Utilities' },
  { value: 'rent', label: 'Rent' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'loan', label: 'Loan' },
  { value: 'other', label: 'Other' },
];

export const DEBT_TYPES: { value: DebtType; label: string }[] = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'student_loan', label: 'Student Loan' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'car_loan', label: 'Car Loan' },
  { value: 'other', label: 'Other' },
];

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const VIEW_MODE_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'monthly', label: 'Full Month' },
  { value: 'P1', label: 'Period 1 (1st–15th)' },
  { value: 'P2', label: 'Period 2 (16th–End)' },
];

export const QUERY_KEYS = {
  months: ['months'] as const,
  month: (id: string) => ['months', id] as const,
  bills: (monthId: string) => ['bills', monthId] as const,
  debts: (year: number, month: number) => ['debts', year, month] as const,
  savings: (monthId: string) => ['savings', monthId] as const,
  monthlyDashboard: (monthId: string) => ['dashboard', 'monthly', monthId] as const,
  monthlyReport: (monthId: string) => ['dashboard', 'monthly-report', monthId] as const,
  annualDashboard: (year: number) => ['dashboard', 'annual', year] as const,
  categoryBudgets: (year: number, month: number) => ['budgets', year, month] as const,
  transactions: (year: number, month: number) => ['transactions', year, month] as const,
};
