import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { DebtModel } from '@/lib/db/models/Debt';
import { requireAuth } from '@/lib/auth/session';
import { z } from 'zod';
import { MonthlyPayment } from '@/types/debt';

const paymentSchema = z.object({
  monthId: z.string().min(1),
  amount: z.number().min(0),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    const body = await request.json();

    const validation = paymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    await connectDB();

    const { monthId, amount } = validation.data;

    const debt = await DebtModel.findOne({ _id: id, userId: user.id });
    
    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    const existingPaymentIndex = debt.monthlyPayments.findIndex(
      (p: MonthlyPayment) => p.monthId === monthId
    );

    let paymentDifference = amount;

    if (existingPaymentIndex >= 0) {
      const oldAmount = debt.monthlyPayments[existingPaymentIndex].amount;
      paymentDifference = amount - oldAmount;
      debt.monthlyPayments[existingPaymentIndex].amount = amount;
      debt.monthlyPayments[existingPaymentIndex].paidAt = new Date();
    } else {
      debt.monthlyPayments.push({
        monthId,
        amount,
        paidAt: new Date(),
      });
    }

    debt.totalPaidAllTime = (debt.totalPaidAllTime || 0) + paymentDifference;
    debt.lastPaymentDate = new Date();

    await debt.save();

    return NextResponse.json({ debt });
  } catch (error) {
    console.error('Record payment error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}