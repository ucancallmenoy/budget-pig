import { Bill } from '@/types/bill';

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

/**
 * Get days until bill is due in a specific month
 * @param dueDate - Day of month (1-31)
 * @param year - Year to check
 * @param month - Month to check (1-12)
 */
export function getDaysUntilDue(dueDate: number, year: number, month: number): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDateForMonth = Math.min(dueDate, new Date(year, month, 0).getDate());
  const nextDueDate = new Date(year, month - 1, dueDateForMonth);
  nextDueDate.setHours(0, 0, 0, 0);

  if (nextDueDate < today) {
    return (nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  }

  const diffTime = nextDueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if bill is overdue in a specific month
 * @param dueDate - Day of month (1-31)
 * @param year - Year to check
 * @param month - Month to check (1-12)
 */
export function isBillOverdue(dueDate: number, year: number, month: number): boolean {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  if (currentYear !== year || currentMonth !== month) {
    return false;
  }

  return currentDay > dueDate;
}

export function getBillStatusDisplay(
  bill: Bill,
  monthId: string,
  year: number,
  month: number
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