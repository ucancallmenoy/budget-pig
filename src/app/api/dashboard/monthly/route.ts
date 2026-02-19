import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { MonthModel } from '@/lib/db/models/Month';
import { BillModel } from '@/lib/db/models/Bill';
import { DebtModel } from '@/lib/db/models/Debt';
import { SavingModel } from '@/lib/db/models/Saving';
import { CategoryBudgetModel } from '@/lib/db/models/CategoryBudget';
import { TransactionModel } from '@/lib/db/models/Transaction';
import { requireAuth } from '@/lib/auth/session';
import { type ViewMode, isDueDateInViewMode, getLastDayOfMonth, buildPeriodKey, type Period } from '@/utils/period';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const monthId = searchParams.get('monthId');
    const viewMode = (searchParams.get('viewMode') || 'monthly') as ViewMode;

    if (!monthId) {
      return NextResponse.json(
        { error: 'monthId is required' },
        { status: 400 }
      );
    }

    const month = await MonthModel.findOne({ _id: monthId, userId: user.id });

    if (!month) {
      return NextResponse.json({ error: 'Month not found' }, { status: 404 });
    }

    const currentYear = month.year;
    const currentMonth = month.month;

    // ----- Income from budget entries (transactions) with legacy fallback -----
    const incomeTransactions = await TransactionModel.find({
      userId: user.id,
      year: currentYear,
      month: currentMonth,
      type: 'income',
      direction: 'in',
    }).lean();

    const hasIncomeEntries = incomeTransactions.length > 0;
    const monthlyIncomeFromEntries = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const periodIncomeFromEntries = incomeTransactions.reduce(
      (acc, tx) => {
        if (tx.period === 'P1') acc.P1 += tx.amount;
        if (tx.period === 'P2') acc.P2 += tx.amount;
        return acc;
      },
      { P1: 0, P2: 0 },
    );

    const monthlyIncomeTotal = hasIncomeEntries ? monthlyIncomeFromEntries : month.totalIncome;
    const effectiveIncome =
      viewMode === 'monthly'
        ? monthlyIncomeTotal
        : hasIncomeEntries
          ? periodIncomeFromEntries[viewMode as Period]
          : month.totalIncome / 2;

    // ----- Bills (period-filtered) -----
    const allBills = await BillModel.find({
      userId: user.id,
      $or: [{ monthId }, { isRecurring: true }],
    });

    const activeBills = allBills.filter(bill => {
      if (!bill.isRecurring) return bill.monthId === monthId;
      // Recurring & stopped
      if (bill.stoppedFromPeriod) {
        const curKey = buildPeriodKey(currentYear, currentMonth);
        if (curKey >= bill.stoppedFromPeriod) return false;
      }
      return true;
    });

    // Period filter
    const periodBills = activeBills.filter(bill =>
      isDueDateInViewMode(bill.dueDate, currentYear, currentMonth, viewMode),
    );

    let totalBillAmount = 0;
    let totalPaidAmount = 0;
    let totalUnpaidAmount = 0;
    let paidBillsCount = 0;
    let unpaidBillsCount = 0;

    // Track per-category actuals
    const categoryActuals = new Map<string, number>();

    periodBills.forEach(bill => {
      totalBillAmount += bill.amount;

      const monthPayment = bill.monthlyPayments?.find(
        (p: { monthId: string }) => p.monthId === monthId,
      );
      const paidAmount = monthPayment?.amount || 0;

      totalPaidAmount += paidAmount;

      if (paidAmount < bill.amount) {
        totalUnpaidAmount += bill.amount - paidAmount;
        unpaidBillsCount++;
      } else {
        paidBillsCount++;
      }

      // Accumulate category actuals
      const cat = bill.category || 'other';
      categoryActuals.set(cat, (categoryActuals.get(cat) || 0) + bill.amount);
    });

    const bills = {
      total: totalBillAmount,
      paid: totalPaidAmount,
      unpaid: totalUnpaidAmount,
      count: periodBills.length,
      paidCount: paidBillsCount,
      unpaidCount: unpaidBillsCount,
    };

    // ----- Debts (period-filtered) -----
    const allDebts = await DebtModel.find({ userId: user.id });

    const activeDebts = allDebts.filter(debt => {
      const debtStartDate = new Date(debt.startYear, debt.startMonth - 1, 1);
      const currentDate = new Date(currentYear, currentMonth - 1, 1);

      if (currentDate < debtStartDate) return false;

      if (debt.durationMonths) {
        const debtEndDate = new Date(
          debt.startYear,
          debt.startMonth - 1 + debt.durationMonths,
          0,
        );
        if (currentDate > debtEndDate) return false;
      }

      const remainingBalance = debt.originalBalance - (debt.totalPaidAllTime || 0);
      return remainingBalance > 0;
    });

    // Period filter for debts
    const periodDebts = activeDebts.filter(debt => {
      if (viewMode === 'monthly') return true;
      if (debt.paymentFrequency === 'per_period') return true;
      return isDueDateInViewMode(debt.paymentDueDate, currentYear, currentMonth, viewMode);
    });

    let totalRemainingBalance = 0;
    let totalMinimumPayment = 0;
    let totalPaidThisMonth = 0;

    periodDebts.forEach(debt => {
      const remainingBalance = debt.originalBalance - (debt.totalPaidAllTime || 0);
      totalRemainingBalance += Math.max(0, remainingBalance);

      // For per_period debts in a period view, show half the minimum
      const minPayment =
        debt.paymentFrequency === 'per_period' && viewMode !== 'monthly'
          ? debt.minimumPayment / 2
          : debt.minimumPayment;
      totalMinimumPayment += minPayment;

      const monthPayment = debt.monthlyPayments?.find(
        (p: { monthId: string }) => p.monthId === monthId,
      );
      totalPaidThisMonth += monthPayment?.amount || 0;
    });

    const debts = {
      totalBalance: totalRemainingBalance,
      totalMinimumPayment,
      totalPaid: totalPaidThisMonth,
      count: periodDebts.length,
    };

    // ----- Savings -----
    const monthlySavingsAgg = await SavingModel.aggregate([
      { $match: { userId: user.id, monthId, goalType: 'monthly' } },
      {
        $group: {
          _id: null,
          totalTarget: { $sum: '$targetAmount' },
          totalSaved: { $sum: '$savedAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const monthlySavings = monthlySavingsAgg[0] || {
      totalTarget: 0,
      totalSaved: 0,
      count: 0,
    };

    const allSavings = {
      totalTarget: monthlySavings.totalTarget,
      totalSaved: monthlySavings.totalSaved,
      count: monthlySavings.count,
    };

    // ----- Summary -----
    const totalExpenses = bills.total + debts.totalMinimumPayment;
    const remainingIncome = effectiveIncome - totalExpenses;
    const remainingAfterSavings = remainingIncome - monthlySavings.totalSaved;
    const savingsRate =
      effectiveIncome > 0
        ? (allSavings.totalSaved / effectiveIncome) * 100
        : 0;

    // ----- Forecast (#7) -----
    const today = new Date();
    const todayDay = today.getDate();
    const lastDay = getLastDayOfMonth(currentYear, currentMonth);
    const totalSpentSoFar = totalPaidAmount + totalPaidThisMonth;

    let periodEndDay: number;
    let periodStartDay: number;
    if (viewMode === 'P1') {
      periodStartDay = 1;
      periodEndDay = 15;
    } else if (viewMode === 'P2') {
      periodStartDay = 16;
      periodEndDay = lastDay;
    } else {
      periodStartDay = 1;
      periodEndDay = lastDay;
    }

    const daysElapsed = Math.max(1, todayDay - periodStartDay + 1);
    const dailyBurnRate = daysElapsed > 0 ? totalSpentSoFar / daysElapsed : 0;
    const projectedSpend = dailyBurnRate * (periodEndDay - periodStartDay + 1);
    const periodEndRemaining = effectiveIncome - projectedSpend;
    const monthEndRemaining = viewMode === 'monthly'
      ? periodEndRemaining
      : monthlyIncomeTotal - projectedSpend * 2; // rough extrapolation for period view
    const runwayDays = dailyBurnRate > 0 ? Math.floor(effectiveIncome / dailyBurnRate) : 999;

    const forecast = {
      periodEndRemaining: Math.round(periodEndRemaining * 100) / 100,
      monthEndRemaining: Math.round(monthEndRemaining * 100) / 100,
      dailyBurnRate: Math.round(dailyBurnRate * 100) / 100,
      runwayDays,
    };

    // ----- Category variance (#6) -----
    const budgetDocs = await CategoryBudgetModel.find({
      userId: user.id,
      year: currentYear,
      month: currentMonth,
    }).lean();

    const categoryVariance = budgetDocs.map(b => {
      const actual = categoryActuals.get(b.category) || 0;
      const budgeted = viewMode === 'monthly' ? b.budgetAmount : b.budgetAmount / 2;
      const variance = budgeted - actual;
      const percentUsed = budgeted > 0 ? (actual / budgeted) * 100 : 0;
      return {
        category: b.category,
        budgeted: Math.round(budgeted * 100) / 100,
        actual: Math.round(actual * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        percentUsed: Math.round(percentUsed * 100) / 100,
      };
    });

    // ----- Response -----
    const dashboard = {
      monthId: month._id.toString(),
      year: month.year,
      month: month.month,
      viewMode,
      totalIncome: effectiveIncome,
      bills,
      debts,
      savings: {
        totalTarget: allSavings.totalTarget,
        totalSaved: allSavings.totalSaved,
        monthlySaved: monthlySavings.totalSaved,
        count: allSavings.count,
        monthlyCount: monthlySavings.count,
      },
      summary: {
        totalExpenses,
        remainingIncome,
        remainingAfterSavings,
        savingsRate,
      },
      forecast,
      categoryVariance,
    };

    return NextResponse.json({ dashboard });
  } catch (error) {
    console.error('Get monthly dashboard error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
