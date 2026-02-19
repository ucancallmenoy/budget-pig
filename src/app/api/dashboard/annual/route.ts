import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { MonthModel } from '@/lib/db/models/Month';
import { BillModel } from '@/lib/db/models/Bill';
import { DebtModel } from '@/lib/db/models/Debt';
import { SavingModel } from '@/lib/db/models/Saving';
import { TransactionModel } from '@/lib/db/models/Transaction';
import { requireAuth } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');

    if (!yearParam) {
      return NextResponse.json(
        { error: 'year is required' },
        { status: 400 }
      );
    }

    const year = parseInt(yearParam);

    // Load all months for the year in one query (no creation on read!)
    const existingMonths = await MonthModel.find({ userId: user.id, year }).lean();
    const monthMap = new Map(existingMonths.map(m => [m.month, m]));

    // Load all debts once instead of per-month
    const allDebts = await DebtModel.find({ userId: user.id }).lean();

    // Load bills & savings in bulk grouped by monthId
    const monthIds = existingMonths.map(m => m._id.toString());

    const [billsAgg, savingsAgg, incomeAgg] = await Promise.all([
      BillModel.aggregate([
        { $match: { userId: user.id, monthId: { $in: monthIds } } },
        { $group: { _id: '$monthId', total: { $sum: '$amount' } } },
      ]),
      SavingModel.aggregate([
        { $match: { userId: user.id, monthId: { $in: monthIds } } },
        { $group: { _id: '$monthId', total: { $sum: '$savedAmount' } } },
      ]),
      TransactionModel.aggregate([
        { $match: { userId: user.id, year, type: 'income', direction: 'in' } },
        { $group: { _id: '$month', total: { $sum: '$amount' } } },
      ]),
    ]);

    const billsByMonthId = new Map(billsAgg.map((b: { _id: string; total: number }) => [b._id, b.total]));
    const savingsByMonthId = new Map(savingsAgg.map((s: { _id: string; total: number }) => [s._id, s.total]));
    const incomeByMonth = new Map(incomeAgg.map((i: { _id: number; total: number }) => [i._id, i.total]));

    const monthlyBreakdown = [];

    for (let month = 1; month <= 12; month++) {
      const monthData = monthMap.get(month);
      const hasTransactionIncome = incomeByMonth.has(month);
      const income = hasTransactionIncome ? incomeByMonth.get(month)! : (monthData?.totalIncome || 0);
      const mId = monthData?._id?.toString();

      const billsTotal = mId ? (billsByMonthId.get(mId) || 0) : 0;

      // Filter active debts for this month
      const activeDebts = allDebts.filter(debt => {
        const debtStartDate = new Date(debt.startYear, debt.startMonth - 1, 1);
        const monthDate = new Date(year, month - 1, 1);

        if (monthDate < debtStartDate) return false;

        if (debt.durationMonths) {
          const debtEndDate = new Date(
            debt.startYear,
            debt.startMonth - 1 + debt.durationMonths,
            0,
          );
          if (monthDate > debtEndDate) return false;
        }

        const remainingBalance = debt.originalBalance - (debt.totalPaidAllTime || 0);
        return remainingBalance > 0;
      });

      const totalMinPayment = activeDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0);

      const savingsTotal = mId ? (savingsByMonthId.get(mId) || 0) : 0;

      const expenses = billsTotal + totalMinPayment;

      monthlyBreakdown.push({
        month,
        income,
        expenses,
        saved: savingsTotal,
      });
    }

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalSaved = 0;

    monthlyBreakdown.forEach((data) => {
      totalIncome += data.income;
      totalExpenses += data.expenses;
      totalSaved += data.saved;
    });

    const dashboard = {
      year,
      totalIncome,
      totalExpenses,
      totalSaved,
      monthlyBreakdown,
    };

    return NextResponse.json({ dashboard });
  } catch (error) {
    console.error('Get annual dashboard error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
