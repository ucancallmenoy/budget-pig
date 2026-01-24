export interface MonthlyDashboard {
  monthId: string;
  year: number;
  month: number;
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