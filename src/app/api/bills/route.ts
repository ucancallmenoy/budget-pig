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
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    if (monthId) {
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
        
        recurringBills = await BillModel.find({
          userId: user.id,
          monthId: { $in: previousMonthIds },
          isRecurring: true,
        });
      }

      const billMap = new Map<string, any>();
      
      monthBills.forEach(bill => {
        billMap.set(bill._id.toString(), bill.toObject());
      });

      recurringBills.forEach(bill => {
        if (!billMap.has(bill._id.toString())) {
          const billObj = bill.toObject();
          billObj.monthId = monthId;
          billMap.set(bill._id.toString(), billObj);
        }
      });

      const allBills = Array.from(billMap.values()).sort((a, b) => a.dueDate - b.dueDate);

      return NextResponse.json({ bills: allBills });
    }

    if (yearParam && monthParam) {
      const year = parseInt(yearParam);
      const month = parseInt(monthParam);

      let currentMonth = await MonthModel.findOne({
        userId: user.id,
        year,
        month,
      });

      if (!currentMonth) {
        currentMonth = await MonthModel.create({
          userId: user.id,
          year,
          month,
          totalIncome: 0,
        });
      }

      const monthBills = await BillModel.find({
        userId: user.id,
        monthId: currentMonth._id.toString(),
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
        
        recurringBills = await BillModel.find({
          userId: user.id,
          monthId: { $in: previousMonthIds },
          isRecurring: true,
        });
      }

      const billMap = new Map<string, any>();
      
      monthBills.forEach(bill => {
        billMap.set(bill._id.toString(), bill.toObject());
      });

      recurringBills.forEach(bill => {
        if (!billMap.has(bill._id.toString())) {
          const billObj = bill.toObject();
          billObj.monthId = currentMonth!._id.toString();
          billMap.set(bill._id.toString(), billObj);
        }
      });

      const allBills = Array.from(billMap.values()).sort((a, b) => a.dueDate - b.dueDate);

      return NextResponse.json({ bills: allBills });
    }

    return NextResponse.json(
      { error: 'monthId or year and month are required' },
      { status: 400 }
    );
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