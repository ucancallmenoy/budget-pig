import { Debt, PaymentFrequency } from '@/types/debt';

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

export function isDebtActive(debt: Debt, year: number, month: number): boolean {
  const debtStartDate = new Date(debt.startYear, debt.startMonth - 1, 1);
  const currentDate = new Date(year, month - 1, 1);
  
  if (currentDate < debtStartDate) {
    return false;
  }
  
  if (debt.durationMonths) {
    const debtEndDate = new Date(debt.startYear, debt.startMonth - 1 + debt.durationMonths, 0);
    return currentDate <= debtEndDate;
  }
  
  const remainingBalance = getRemainingBalance(debt);
  return remainingBalance > 0;
}

export function isPaymentDue(debt: Debt, currentYear: number, currentMonth: number): boolean {
  const today = new Date();
  const currentDay = today.getDate();
  
  if (debt.paymentFrequency === 'monthly') {
    return currentDay >= debt.paymentDueDate;
  } else {
    return currentDay >= 1 || currentDay >= 15;
  }
}


export function getNextPaymentDate(debt: Debt, currentYear: number, currentMonth: number): Date {
  if (debt.paymentFrequency === 'monthly') {
    return new Date(currentYear, currentMonth - 1, debt.paymentDueDate);
  } else {
    const today = new Date();
    const currentDay = today.getDate();
    
    if (currentDay <= 8) {
      return new Date(currentYear, currentMonth - 1, 1);
    } else {
      return new Date(currentYear, currentMonth - 1, 15);
    }
  }
}

export function isPaymentOverdue(debt: Debt, currentYear: number, currentMonth: number, monthId: string): boolean {
  const monthPayment = getMonthPaymentAmount(debt, monthId);
  
  if (monthPayment >= debt.minimumPayment) {
    return false;
  }
  
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  
  if (currentYear > todayYear || (currentYear === todayYear && currentMonth > todayMonth)) {
    return false;
  }
  
  if (currentYear < todayYear || (currentYear === todayYear && currentMonth < todayMonth)) {
    return true;
  }
  
  if (debt.paymentFrequency === 'monthly') {
    return todayDay > debt.paymentDueDate;
  } else {
    return todayDay > 15;
  }
}

export function getDaysUntilPayment(debt: Debt, currentYear: number, currentMonth: number): number {
  const paymentDate = getNextPaymentDate(debt, currentYear, currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  paymentDate.setHours(0, 0, 0, 0);
  
  const diffTime = paymentDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isMonthPaymentPaid(debt: Debt, monthId: string): boolean {
  const monthPayment = getMonthPaymentAmount(debt, monthId);
  return monthPayment >= debt.minimumPayment;
}

export function getMonthPaymentStatus(debt: Debt, currentYear: number, currentMonth: number, monthId: string): 'paid' | 'unpaid' | 'overdue' {
  if (isPaymentOverdue(debt, currentYear, currentMonth, monthId)) {
    return 'overdue';
  }
  
  if (isMonthPaymentPaid(debt, monthId)) {
    return 'paid';
  }
  
  return 'unpaid';
}