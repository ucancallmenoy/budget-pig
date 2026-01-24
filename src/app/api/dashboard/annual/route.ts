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

    const months = await MonthModel.find({
      userId: user.id,
      year,
    }).sort({ month: 1 });

    if (months.length === 0) {
      return NextResponse.json({
        dashboard: {
          year,
          totalIncome: 0,
          totalExpenses: 0,
          totalSaved: 0,
          monthlyBreakdown: [],
        },
      });
    }

    const monthIds = months.map((m) => m._id.toString());

    const billsByMonth = await BillModel.aggregate([
      { $match: { userId: user.id, monthId: { $in: monthIds } } },
      {
        $group: {
          _id: '$monthId',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const allDebts = await DebtModel.find({
      userId: user.id,
    });

    const debtsByMonthMap = new Map<string, number>();
    
    months.forEach(month => {
      const monthId = month._id.toString();
      const currentYear = month.year;
      const currentMonth = month.month;

      const activeDebts = allDebts.filter(debt => {
        const debtStartDate = new Date(debt.startYear, debt.startMonth - 1, 1);
        const monthDate = new Date(currentYear, currentMonth - 1, 1);
        
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
      debtsByMonthMap.set(monthId, totalMinPayment);
    });

    const savingsByMonth = await SavingModel.aggregate([
      { $match: { userId: user.id, monthId: { $in: monthIds } } },
      {
        $group: {
          _id: '$monthId',
          total: { $sum: '$savedAmount' },
        },
      },
    ]);

    const billsMap = new Map(
      billsByMonth.map((b) => [b._id.toString(), b.total])
    );
    const savingsMap = new Map(
      savingsByMonth.map((s) => [s._id.toString(), s.total])
    );

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalSaved = 0;

    const monthlyBreakdown = months.map((month) => {
      const monthIdStr = month._id.toString();
      const bills = billsMap.get(monthIdStr) || 0;
      const debts = debtsByMonthMap.get(monthIdStr) || 0;
      const saved = savingsMap.get(monthIdStr) || 0;
      const expenses = bills + debts;

      totalIncome += month.totalIncome;
      totalExpenses += expenses;
      totalSaved += saved;

      return {
        month: month.month,
        income: month.totalIncome,
        expenses,
        saved,
      };
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