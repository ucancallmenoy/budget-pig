import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { DebtModel } from '@/lib/db/models/Debt';
import { requireAuth } from '@/lib/auth/session';
import { createDebtSchema } from '@/lib/validations/debt';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json(
        { error: 'year and month are required' },
        { status: 400 }
      );
    }

    const currentYear = parseInt(year);
    const currentMonth = parseInt(month);

    const allDebts = await DebtModel.find({
      userId: user.id,
    }).sort({ createdAt: -1 });

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

    return NextResponse.json({ debts: activeDebts });
  } catch (error) {
    console.error('Get debts error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validation = createDebtSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    await connectDB();

    const debt = await DebtModel.create({
      ...validation.data,
      userId: user.id,
    });

    return NextResponse.json({ debt }, { status: 201 });
  } catch (error) {
    console.error('Create debt error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}