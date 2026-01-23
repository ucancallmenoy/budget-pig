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

    // Get all months for the year
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

    // Aggregate bills by month
    const billsByMonth = await BillModel.aggregate([
      { $match: { userId: user.id, monthId: { $in: monthIds } } },
      {
        $group: {
          _id: '$monthId',
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Aggregate debts by month
    const debtsByMonth = await DebtModel.aggregate([
      { $match: { userId: user.id, monthId: { $in: monthIds } } },
      {
        $group: {
          _id: '$monthId',
          total: { $sum: '$minimumPayment' },
        },
      },
    ]);

    // Aggregate savings by month
    const savingsByMonth = await SavingModel.aggregate([
      { $match: { userId: user.id, monthId: { $in: monthIds } } },
      {
        $group: {
          _id: '$monthId',
          total: { $sum: '$savedAmount' },
        },
      },
    ]);

    // Create lookup maps
    const billsMap = new Map(
      billsByMonth.map((b) => [b._id.toString(), b.total])
    );
    const debtsMap = new Map(
      debtsByMonth.map((d) => [d._id.toString(), d.total])
    );
    const savingsMap = new Map(
      savingsByMonth.map((s) => [s._id.toString(), s.total])
    );

    // Build monthly breakdown
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalSaved = 0;

    const monthlyBreakdown = months.map((month) => {
      const monthIdStr = month._id.toString();
      const bills = billsMap.get(monthIdStr) || 0;
      const debts = debtsMap.get(monthIdStr) || 0;
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