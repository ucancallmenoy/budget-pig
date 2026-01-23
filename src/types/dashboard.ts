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
    count: number;
  };
  summary: {
    totalExpenses: number;
    remainingIncome: number;
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