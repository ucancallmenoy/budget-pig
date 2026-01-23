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
    const monthId = searchParams.get('monthId');

    if (!monthId) {
      return NextResponse.json(
        { error: 'monthId is required' },
        { status: 400 }
      );
    }

    // Get month data
    const month = await MonthModel.findOne({ _id: monthId, userId: user.id });

    if (!month) {
      return NextResponse.json({ error: 'Month not found' }, { status: 404 });
    }

    // Aggregate bills data
    const billsAgg = await BillModel.aggregate([
      { $match: { userId: user.id, monthId } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          paid: {
            $sum: {
              $cond: [{ $eq: ['$isPaid', true] }, '$amount', 0],
            },
          },
          unpaid: {
            $sum: {
              $cond: [{ $eq: ['$isPaid', false] }, '$amount', 0],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const bills = billsAgg[0] || {
      total: 0,
      paid: 0,
      unpaid: 0,
      count: 0,
    };

    // Aggregate debts data
    const debtsAgg = await DebtModel.aggregate([
      { $match: { userId: user.id, monthId } },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' },
          totalMinimumPayment: { $sum: '$minimumPayment' },
          totalPaid: { $sum: '$paidAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const debts = debtsAgg[0] || {
      totalBalance: 0,
      totalMinimumPayment: 0,
      totalPaid: 0,
      count: 0,
    };

    // Aggregate savings data
    const savingsAgg = await SavingModel.aggregate([
      { $match: { userId: user.id, monthId } },
      {
        $group: {
          _id: null,
          totalTarget: { $sum: '$targetAmount' },
          totalSaved: { $sum: '$savedAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const savings = savingsAgg[0] || {
      totalTarget: 0,
      totalSaved: 0,
      count: 0,
    };

    // Calculate summary
    const totalExpenses = bills.total + debts.totalMinimumPayment;
    const remainingIncome = month.totalIncome - totalExpenses;
    const savingsRate =
      month.totalIncome > 0
        ? (savings.totalSaved / month.totalIncome) * 100
        : 0;

    const dashboard = {
      monthId: month._id.toString(),
      year: month.year,
      month: month.month,
      totalIncome: month.totalIncome,
      bills,
      debts,
      savings,
      summary: {
        totalExpenses,
        remainingIncome,
        savingsRate,
      },
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