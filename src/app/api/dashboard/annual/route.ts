import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { MonthModel } from '@/lib/db/models/Month';
import { BillModel } from '@/lib/db/models/Bill';
import { DebtModel } from '@/lib/db/models/Debt';
import { SavingModel } from '@/lib/db/models/Saving';
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

    const monthlyBreakdown = [];

    for (let month = 1; month <= 12; month++) {
      let monthData = await MonthModel.findOne({
        userId: user.id,
        year,
        month,
      });

      if (!monthData) {
        monthData = await MonthModel.create({
          userId: user.id,
          year,
          month,
          totalIncome: 0,
        });
      }

      const monthId = monthData._id.toString();

      const billsByMonth = await BillModel.aggregate([
        { $match: { userId: user.id, monthId } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);

      const billsTotal = billsByMonth[0]?.total || 0;

      const allDebts = await DebtModel.find({
        userId: user.id,
      });

      const activeDebts = allDebts.filter(debt => {
        const debtStartDate = new Date(debt.startYear, debt.startMonth - 1, 1);
        const monthDate = new Date(year, month - 1, 1);

        if (monthDate < debtStartDate) {
          return false;
        }

        if (debt.durationMonths) {
          const debtEndDate = new Date(debt.startYear, debt.startMonth - 1 + debt.durationMonths, 0);
          if (monthDate > debtEndDate) {
            return false;
          }
        }

        const remainingBalance = debt.originalBalance - (debt.totalPaidAllTime || 0);
        return remainingBalance > 0;
      });

      const totalMinPayment = activeDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0);

      const savingsByMonth = await SavingModel.aggregate([
        { $match: { userId: user.id, monthId } },
        {
          $group: {
            _id: null,
            total: { $sum: '$savedAmount' },
          },
        },
      ]);

      const savingsTotal = savingsByMonth[0]?.total || 0;

      const expenses = billsTotal + totalMinPayment;

      monthlyBreakdown.push({
        month,
        income: monthData.totalIncome,
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