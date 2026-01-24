import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { BillModel } from '@/lib/db/models/Bill';
import { MonthModel } from '@/lib/db/models/Month';
import { requireAuth } from '@/lib/auth/session';
import { z } from 'zod';
import { MonthlyBillPayment } from '@/types/bill';

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

    // Verify month exists
    const month = await MonthModel.findOne({ _id: monthId });
    if (!month) {
      return NextResponse.json(
        { error: 'Month not found' },
        { status: 404 }
      );
    }

    const bill = await BillModel.findOne({ _id: id, userId: user.id });
    
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Find or create payment record for this month
    const existingPaymentIndex = bill.monthlyPayments.findIndex(
      (p: MonthlyBillPayment) => p.monthId === monthId
    );

    if (existingPaymentIndex >= 0) {
      bill.monthlyPayments[existingPaymentIndex].amount = amount;
      bill.monthlyPayments[existingPaymentIndex].paidAt = new Date();
    } else {
      bill.monthlyPayments.push({
        monthId,
        amount,
        paidAt: new Date(),
      });
    }

    await bill.save();

    return NextResponse.json({ bill });
  } catch (error) {
    console.error('Record bill payment error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}