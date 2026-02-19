import { Bill } from '@/types/bill';
import {
  type Period,
  type ViewMode,
  clampDueDate,
  isDueDateInPeriod,
  isDueDateInViewMode,
  buildPeriodKey,
} from '@/utils/period';

// ---------------------------------------------------------------------------
// Payment helpers
// ---------------------------------------------------------------------------

export function getMonthBillPaymentAmount(bill: Bill, monthId: string): number {
  const monthPayment = bill.monthlyPayments?.find(p => p.monthId === monthId);
  return monthPayment?.amount || 0;
}

export function isBillPaidThisMonth(bill: Bill, monthId: string): boolean {
  const monthPayment = getMonthBillPaymentAmount(bill, monthId);
  return monthPayment >= bill.amount;
}

export function getBillPaymentStatus(bill: Bill, monthId: string): 'paid' | 'unpaid' {
  return isBillPaidThisMonth(bill, monthId) ? 'paid' : 'unpaid';
}

// ---------------------------------------------------------------------------
// Due date helpers (period-aware, uses clampDueDate)
// ---------------------------------------------------------------------------

/**
 * Get the effective due date for a bill in a given month.
 * Clamps day-31 invoices to the actual last day (e.g. Feb 28).
 */
export function getEffectiveDueDate(bill: Bill, year: number, month: number): number {
  return clampDueDate(bill.dueDate, year, month);
}

/**
 * Get days until bill is due in a specific month.
 * Uses clampDueDate to handle months with fewer days.
 */
export function getDaysUntilDue(dueDate: number, year: number, month: number): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDateForMonth = clampDueDate(dueDate, year, month);
  const nextDueDate = new Date(year, month - 1, dueDateForMonth);
  nextDueDate.setHours(0, 0, 0, 0);

  if (nextDueDate < today) {
    return (nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  }

  const diffTime = nextDueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if bill is overdue in a specific month.
 */
export function isBillOverdue(dueDate: number, year: number, month: number): boolean {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  if (currentYear !== year || currentMonth !== month) return false;

  const effectiveDue = clampDueDate(dueDate, year, month);
  return currentDay > effectiveDue;
}

// ---------------------------------------------------------------------------
// Period-aware visibility
// ---------------------------------------------------------------------------

/**
 * Determines whether a bill should appear in the given view mode.
 * Also respects `stoppedFromPeriod` for recurring bills.
 */
export function isBillInViewMode(
  bill: Bill,
  year: number,
  month: number,
  viewMode: ViewMode,
): boolean {
  // Check if recurring bill was stopped before this period
  if (bill.isRecurring && bill.stoppedFromPeriod) {
    const currentKey = viewMode === 'monthly'
      ? buildPeriodKey(year, month)
      : buildPeriodKey(year, month, viewMode as Period);
    if (currentKey >= bill.stoppedFromPeriod) return false;
  }

  return isDueDateInViewMode(bill.dueDate, year, month, viewMode);
}

// ---------------------------------------------------------------------------
// Full status display
// ---------------------------------------------------------------------------

export function getBillStatusDisplay(
  bill: Bill,
  monthId: string,
  year: number,
  month: number,
): {
  status: 'paid' | 'overdue' | 'upcoming';
  daysUntilDue: number;
  displayText: string;
} {
  const monthPayment = getMonthBillPaymentAmount(bill, monthId);
  const isPaid = monthPayment >= bill.amount;

  if (isPaid) {
    return {
      status: 'paid',
      daysUntilDue: 0,
      displayText: 'Paid',
    };
  }

  const daysUntilDue = getDaysUntilDue(bill.dueDate, year, month);
  const isOverdue = isBillOverdue(bill.dueDate, year, month);

  if (isOverdue) {
    return {
      status: 'overdue',
      daysUntilDue: daysUntilDue,
      displayText: `${Math.abs(Math.floor(daysUntilDue))} days overdue`,
    };
  }

  return {
    status: 'upcoming',
    daysUntilDue: daysUntilDue,
    displayText: `${Math.ceil(daysUntilDue)} days until due`,
  };
}