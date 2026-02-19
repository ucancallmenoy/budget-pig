import type { CategoryVariance } from './budget';
import type { ViewMode } from '@/utils/period';

export interface MonthlyDashboard {
  monthId: string;
  year: number;
  month: number;
  viewMode: ViewMode;
  totalIncome: number;
  bills: {
    total: number;
    paid: number;
    unpaid: number;
    count: number;
    paidCount: number;
    unpaidCount: number;
  };
  debts: {
    totalBalance: number;
    totalMinimumPayment: number;
    totalPaid: number;
    count: number;
  };
  savings: {
    totalTarget: number;
    totalSaved: number;
    monthlySaved: number;
    count: number;
    monthlyCount: number;
  };
  summary: {
    totalExpenses: number;
    remainingIncome: number;
    remainingAfterSavings: number;
    savingsRate: number;
  };
  forecast: {
    periodEndRemaining: number;
    monthEndRemaining: number;
    dailyBurnRate: number;
    runwayDays: number;
  };
  categoryVariance: CategoryVariance[];
}

export interface AnnualDashboard {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  totalSaved: number;
  monthlyBreakdown: {
    month: number;
    income: number;
    expenses: number;
    saved: number;
  }[];
}

export type MonthlyReportEntryType = 'budget' | 'bill' | 'debt';

export interface MonthlyReportEntry {
  id: string;
  type: MonthlyReportEntryType;
  title: string;
  category?: string;
  note?: string;
  amount: number;
  date: string;
  period: 'P1' | 'P2';
}

export interface MonthlyReport {
  monthId: string;
  year: number;
  month: number;
  viewMode: ViewMode;
  totals: {
    income: number;
    expenses: number;
    net: number;
  };
  entries: MonthlyReportEntry[];
}
