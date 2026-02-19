import { Debt } from '@/types/debt';
import {
  type Period,
  type ViewMode,
  clampDueDate,
  getPeriodForDay,
  isDueDateInPeriod,
} from '@/utils/period';

// ---------------------------------------------------------------------------
// Progress helpers
// ---------------------------------------------------------------------------

export function calculatePaymentProgress(debt: Debt): number {
  if (debt.originalBalance === 0) return 100;
  const progressPercentage = (debt.totalPaidAllTime / debt.originalBalance) * 100;
  return Math.min(progressPercentage, 100);
}

export function getMonthPaymentAmount(debt: Debt, monthId: string): number {
  const monthPayment = debt.monthlyPayments?.find(p => p.monthId === monthId);
  return monthPayment?.amount || 0;
}

export function getTotalPaidAllTime(debt: Debt): number {
  return debt.totalPaidAllTime || 0;
}

export function getRemainingBalance(debt: Debt): number {
  return Math.max(0, debt.originalBalance - debt.totalPaidAllTime);
}

// ---------------------------------------------------------------------------
// Active / visibility checks
// ---------------------------------------------------------------------------

export function isDebtActive(debt: Debt, year: number, month: number): boolean {
  const debtStartDate = new Date(debt.startYear, debt.startMonth - 1, 1);
  const currentDate = new Date(year, month - 1, 1);

  if (currentDate < debtStartDate) return false;

  if (debt.durationMonths) {
    const debtEndDate = new Date(debt.startYear, debt.startMonth - 1 + debt.durationMonths, 0);
    return currentDate <= debtEndDate;
  }

  return getRemainingBalance(debt) > 0;
}

// ---------------------------------------------------------------------------
// Per-period payment helpers
// ---------------------------------------------------------------------------

/**
 * For `per_period` debts the due date rotates per period:
 *   P1 → paymentDueDate clamped to 1-15
 *   P2 → paymentDueDate clamped to 16–last day
 * For `monthly` debts the due date is just clamped to the month.
 */
export function getEffectiveDueDate(
  debt: Debt,
  year: number,
  month: number,
  period?: Period,
): number {
  const clamped = clampDueDate(debt.paymentDueDate, year, month);

  if (debt.paymentFrequency !== 'per_period' || !period) return clamped;

  // Ensure the due date sits within the period window
  if (period === 'P1') return Math.min(clamped, 15);
  return Math.max(clamped, 16);
}

/**
 * Should this debt appear / be relevant in the given view mode?
 *   - monthly: always visible if active
 *   - per_period debts: visible in the matching period
 *   - monthly debts: visible in the period their due-date falls into
 */
export function isDebtInViewMode(
  debt: Debt,
  year: number,
  month: number,
  viewMode: ViewMode,
): boolean {
  if (viewMode === 'monthly') return true;
  const period = viewMode as Period;

  if (debt.paymentFrequency === 'per_period') {
    // Per-period debts are due every period
    return true;
  }

  // Monthly debts – visible only in the period their due-date falls into
  return isDueDateInPeriod(debt.paymentDueDate, year, month, period);
}

// ---------------------------------------------------------------------------
// Payment due / overdue checks (period-aware)
// ---------------------------------------------------------------------------

export function isPaymentDue(
  debt: Debt,
  currentYear: number,
  currentMonth: number,
  period?: Period,
): boolean {
  const today = new Date();
  const currentDay = today.getDate();

  if (debt.paymentFrequency === 'per_period') {
    if (!period) return true; // Full-month view – always considered due
    const dueDateForPeriod = getEffectiveDueDate(debt, currentYear, currentMonth, period);
    return currentDay >= dueDateForPeriod;
  }

  // monthly frequency
  return currentDay >= clampDueDate(debt.paymentDueDate, currentYear, currentMonth);
}

export function getNextPaymentDate(
  debt: Debt,
  currentYear: number,
  currentMonth: number,
  period?: Period,
): Date {
  const effectiveDay = getEffectiveDueDate(debt, currentYear, currentMonth, period);
  return new Date(currentYear, currentMonth - 1, effectiveDay);
}

export function isPaymentOverdue(
  debt: Debt,
  currentYear: number,
  currentMonth: number,
  monthId: string,
  period?: Period,
): boolean {
  const monthPayment = getMonthPaymentAmount(debt, monthId);

  // For per_period debts the per-period minimum is half the monthly minimum
  const requiredPayment =
    debt.paymentFrequency === 'per_period' && period
      ? debt.minimumPayment / 2
      : debt.minimumPayment;

  if (monthPayment >= requiredPayment) return false;

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  // Future month can't be overdue
  if (currentYear > todayYear || (currentYear === todayYear && currentMonth > todayMonth)) {
    return false;
  }

  // Past month is always overdue if not paid
  if (currentYear < todayYear || (currentYear === todayYear && currentMonth < todayMonth)) {
    return true;
  }

  // Current month – compare against effective due date
  const effectiveDay = getEffectiveDueDate(debt, currentYear, currentMonth, period);
  return todayDay > effectiveDay;
}

export function getDaysUntilPayment(
  debt: Debt,
  currentYear: number,
  currentMonth: number,
  period?: Period,
): number {
  const paymentDate = getNextPaymentDate(debt, currentYear, currentMonth, period);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  paymentDate.setHours(0, 0, 0, 0);

  const diffTime = paymentDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Payment status
// ---------------------------------------------------------------------------

export function isMonthPaymentPaid(debt: Debt, monthId: string, period?: Period): boolean {
  const monthPayment = getMonthPaymentAmount(debt, monthId);
  const required =
    debt.paymentFrequency === 'per_period' && period
      ? debt.minimumPayment / 2
      : debt.minimumPayment;
  return monthPayment >= required;
}

export function getMonthPaymentStatus(
  debt: Debt,
  currentYear: number,
  currentMonth: number,
  monthId: string,
  period?: Period,
): 'paid' | 'unpaid' | 'overdue' {
  if (isPaymentOverdue(debt, currentYear, currentMonth, monthId, period)) {
    return 'overdue';
  }
  if (isMonthPaymentPaid(debt, monthId, period)) {
    return 'paid';
  }
  return 'unpaid';
}