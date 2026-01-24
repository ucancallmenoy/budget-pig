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

    const month = await MonthModel.findOne({ _id: monthId, userId: user.id });

    if (!month) {
      return NextResponse.json({ error: 'Month not found' }, { status: 404 });
    }

    const currentYear = month.year;
    const currentMonth = month.month;

    const allBills = await BillModel.find({
      userId: user.id,
      $or: [
        { monthId },
        { isRecurring: true }, 
      ],
    });

    const activeBills = allBills.filter(bill => {
      if (!bill.isRecurring) {
        return bill.monthId === monthId;
      }

      const billMonth = bill.monthId;
      return true;
    });

    let totalBillAmount = 0;
    let totalPaidAmount = 0;
    let totalUnpaidAmount = 0;
    let paidBillsCount = 0;
    let unpaidBillsCount = 0;

    activeBills.forEach(bill => {
      totalBillAmount += bill.amount;

      const monthPayment = bill.monthlyPayments?.find(p => p.monthId === monthId);
      const paidAmount = monthPayment?.amount || 0;

      totalPaidAmount += paidAmount;

      if (paidAmount < bill.amount) {
        totalUnpaidAmount += (bill.amount - paidAmount);
        unpaidBillsCount++;
      } else if (paidAmount >= bill.amount) {
        paidBillsCount++;
      }
    });

    const bills = {
      total: totalBillAmount,
      paid: totalPaidAmount,
      unpaid: totalUnpaidAmount,
      count: activeBills.length,
      paidCount: paidBillsCount,
      unpaidCount: unpaidBillsCount,
    };

    const allDebts = await DebtModel.find({
      userId: user.id,
    });

    const activeDebts = allDebts.filter(debt => {
      const debtStartDate = new Date(debt.startYear, debt.startMonth - 1, 1);
      const currentDate = new Date(currentYear, currentMonth - 1, 1);
      
      if (currentDate < debtStartDate) {
        return false;
      }
      
      if (debt.durationMonths) {
        const debtEndDate = new Date(debt.startYear, debt.startMonth - 1 + debt.durationMonths, 0);
        if (currentDate > debtEndDate) {
          return false;
        }
      }
      
      const remainingBalance = debt.originalBalance - (debt.totalPaidAllTime || 0);
      return remainingBalance > 0;
    });

    let totalRemainingBalance = 0;
    let totalMinimumPayment = 0;
    let totalPaidThisMonth = 0;

    activeDebts.forEach(debt => {
      const remainingBalance = debt.originalBalance - (debt.totalPaidAllTime || 0);
      totalRemainingBalance += Math.max(0, remainingBalance);
      totalMinimumPayment += debt.minimumPayment;
      const monthPayment = debt.monthlyPayments?.find(p => p.monthId === monthId);
      totalPaidThisMonth += monthPayment?.amount || 0;
    });

    const debts = {
      totalBalance: totalRemainingBalance,
      totalMinimumPayment,
      totalPaid: totalPaidThisMonth,
      count: activeDebts.length,
    };

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

    const totalExpenses = bills.total + debts.totalMinimumPayment;
    const remainingIncome = month.totalIncome - totalExpenses;
    const remainingAfterSavings = remainingIncome - monthlySavings.totalSaved;
    const savingsRate =
      month.totalIncome > 0
        ? (allSavings.totalSaved / month.totalIncome) * 100
        : 0;

    const dashboard = {
      monthId: month._id.toString(),
      year: month.year,
      month: month.month,
      totalIncome: month.totalIncome,
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