import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { MonthModel } from '@/lib/db/models/Month';
import { BillModel } from '@/lib/db/models/Bill';
import { DebtModel } from '@/lib/db/models/Debt';
import { TransactionModel } from '@/lib/db/models/Transaction';
import { requireAuth } from '@/lib/auth/session';
import { getPeriodForDay, type ViewMode } from '@/utils/period';
import type { MonthlyReportEntry } from '@/types/dashboard';

interface MonthlyPaymentRecord {
  monthId: string;
  amount: number;
  paidAt?: Date | string;
}

const REPORT_FALLBACK_HOUR_UTC = 12;

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function getSafeDate(
  input: Date | string | undefined,
  year: number,
  month: number,
  enforceMonth = false,
): Date {
  const fallback = new Date(Date.UTC(year, month - 1, 1, REPORT_FALLBACK_HOUR_UTC));
  if (!input) return fallback;

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return fallback;
  if (!enforceMonth) return date;

  if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1) {
    return date;
  }

  // Keep the original day-of-month but pin it to the selected report month.
  const safeDay = Math.min(date.getUTCDate(), getLastDayOfMonth(year, month));
  return new Date(Date.UTC(year, month - 1, safeDay, REPORT_FALLBACK_HOUR_UTC));
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const monthId = searchParams.get('monthId');
    const viewMode = (searchParams.get('viewMode') || 'monthly') as ViewMode;

    if (!monthId) {
      return NextResponse.json({ error: 'monthId is required' }, { status: 400 });
    }

    const month = await MonthModel.findOne({ _id: monthId, userId: user.id }).lean();
    if (!month) {
      return NextResponse.json({ error: 'Month not found' }, { status: 404 });
    }

    const year = month.year;
    const monthNumber = month.month;
    const reportEntries: MonthlyReportEntry[] = [];

    const budgetTransactions = await TransactionModel.find({
      userId: user.id,
      year,
      month: monthNumber,
      type: 'income',
      direction: 'in',
    }).lean();

    budgetTransactions.forEach((tx) => {
      if (viewMode !== 'monthly' && tx.period !== viewMode) return;
      reportEntries.push({
        id: tx._id.toString(),
        type: 'budget',
        title: tx.description,
        category: tx.category,
        note: tx.note,
        amount: tx.amount,
        date: getSafeDate(tx.date, year, monthNumber).toISOString(),
        period: tx.period,
      });
    });

    const [billDocs, debtDocs] = await Promise.all([
      BillModel.find({
        userId: user.id,
        monthlyPayments: {
          $elemMatch: { monthId, amount: { $gt: 0 } },
        },
      }).lean(),
      DebtModel.find({
        userId: user.id,
        monthlyPayments: {
          $elemMatch: { monthId, amount: { $gt: 0 } },
        },
      }).lean(),
    ]);

    billDocs.forEach((bill) => {
      const payment = (bill.monthlyPayments as MonthlyPaymentRecord[]).find((p) => p.monthId === monthId);
      if (!payment || payment.amount <= 0) return;
      const paymentDate = getSafeDate(payment.paidAt, year, monthNumber, true);
      const period = getPeriodForDay(paymentDate.getDate());
      if (viewMode !== 'monthly' && period !== viewMode) return;

      reportEntries.push({
        id: `bill-${bill._id.toString()}-${monthId}`,
        type: 'bill',
        title: bill.name,
        category: bill.category,
        amount: payment.amount,
        date: paymentDate.toISOString(),
        period,
      });
    });

    debtDocs.forEach((debt) => {
      const payment = (debt.monthlyPayments as MonthlyPaymentRecord[]).find((p) => p.monthId === monthId);
      if (!payment || payment.amount <= 0) return;
      const paymentDate = getSafeDate(payment.paidAt, year, monthNumber, true);
      const period = getPeriodForDay(paymentDate.getDate());
      if (viewMode !== 'monthly' && period !== viewMode) return;

      reportEntries.push({
        id: `debt-${debt._id.toString()}-${monthId}`,
        type: 'debt',
        title: debt.name,
        category: debt.type,
        amount: payment.amount,
        date: paymentDate.toISOString(),
        period,
      });
    });

    reportEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totals = reportEntries.reduce(
      (acc, entry) => {
        if (entry.type === 'budget') {
          acc.income += entry.amount;
        } else {
          acc.expenses += entry.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0 },
    );

    const report = {
      monthId,
      year,
      month: monthNumber,
      viewMode,
      totals: {
        income: totals.income,
        expenses: totals.expenses,
        net: totals.income - totals.expenses,
      },
      entries: reportEntries,
    };

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Get monthly report error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
