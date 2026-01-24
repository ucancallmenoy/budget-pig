import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { BillModel } from '@/lib/db/models/Bill';
import { MonthModel } from '@/lib/db/models/Month';
import { requireAuth } from '@/lib/auth/session';
import { createBillSchema } from '@/lib/validations/bill';

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

    const currentMonth = await MonthModel.findOne({ _id: monthId, userId: user.id });
    
    if (!currentMonth) {
      return NextResponse.json(
        { error: 'Month not found' },
        { status: 404 }
      );
    }

    const { year, month } = currentMonth;
    const monthBills = await BillModel.find({
      userId: user.id,
      monthId,
    }).sort({ dueDate: 1 });

    const allPreviousMonths = await MonthModel.find({
      userId: user.id,
      $or: [
        { year: { $lt: year } },
        { year, month: { $lt: month } } 
      ]
    }).sort({ year: 1, month: 1 });

    let recurringBills: any[] = [];

    if (allPreviousMonths.length > 0) {
      const previousMonthIds = allPreviousMonths.map(m => m._id.toString());

      const monthlyRecurringBills = await BillModel.find({
        userId: user.id,
        monthId: { $in: previousMonthIds },
        isRecurring: true,
        recurrence: 'monthly',
      });

      // Get yearly recurring bills
      const yearlyRecurringBills = await BillModel.find({
        userId: user.id,
        isRecurring: true,
        recurrence: 'yearly',
      });

      const applicableYearlyBills = yearlyRecurringBills.filter(bill => {
        const billMonth = allPreviousMonths.find(m => m._id.toString() === bill.monthId);
        if (!billMonth) return false;
        return billMonth.month === month;
      });

      recurringBills = [...monthlyRecurringBills, ...applicableYearlyBills];
    }

    const billMap = new Map<string, any>();
    
    monthBills.forEach(bill => {
      billMap.set(bill._id.toString(), bill.toObject());
    });

    recurringBills.forEach(bill => {
      const billId = bill._id.toString();
      if (!billMap.has(billId)) {
        billMap.set(billId, bill.toObject());
      }
    });

    const allBills = Array.from(billMap.values()).sort((a, b) => a.dueDate - b.dueDate);

    console.log(`Retrieved ${allBills.length} bills for month ${month}/${year}`);

    return NextResponse.json({ bills: allBills });
  } catch (error) {
    console.error('Get bills error:', error);
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

    const validation = createBillSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    await connectDB();

    const bill = await BillModel.create({
      ...validation.data,
      userId: user.id,
    });
    return NextResponse.json({ bill }, { status: 201 });
  } catch (error) {
    console.error('Create bill error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}