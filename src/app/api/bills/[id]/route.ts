import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { BillModel } from '@/lib/db/models/Bill';
import { BillOverrideModel } from '@/lib/db/models/BillOverride';
import { requireAuth } from '@/lib/auth/session';
import { updateBillSchema } from '@/lib/validations/bill';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    const body = await request.json();

    // `recurringAction` and `periodKey` come alongside normal update fields
    const { recurringAction, periodKey, ...updateFields } = body as {
      recurringAction?: 'this_period' | 'this_and_future';
      periodKey?: string;
      [key: string]: unknown;
    };

    const validation = updateBillSchema.safeParse(updateFields);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    await connectDB();

    // -- Recurring: "this period only" → create / update BillOverride
    if (recurringAction === 'this_period' && periodKey) {
      const bill = await BillModel.findOne({ _id: id, userId: user.id });
      if (!bill) {
        return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
      }

      await BillOverrideModel.findOneAndUpdate(
        { userId: user.id, billId: id, periodKey },
        { $set: { overrides: validation.data } },
        { upsert: true, new: true },
      );

      // Return the bill with overrides applied client-side
      const merged = { ...bill.toObject(), ...validation.data };
      return NextResponse.json({ bill: merged });
    }

    // -- Recurring: "this and future" or normal edit → update the bill directly
    const bill = await BillModel.findOneAndUpdate(
      { _id: id, userId: user.id },
      { $set: validation.data },
      { new: true }
    );

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json({ bill });
  } catch (error) {
    console.error('Update bill error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    
    await connectDB();

    const { searchParams } = new URL(request.url);
    const recurringAction = searchParams.get('recurringAction') as 'this_period' | 'this_and_future' | null;
    const periodKey = searchParams.get('periodKey');

    const bill = await BillModel.findOne({ _id: id, userId: user.id });
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // -- Recurring: "this period only" → suppress via BillOverride
    if (bill.isRecurring && recurringAction === 'this_period' && periodKey) {
      await BillOverrideModel.findOneAndUpdate(
        { userId: user.id, billId: id, periodKey },
        { $set: { isSuppressed: true } },
        { upsert: true, new: true },
      );
      return NextResponse.json({ success: true });
    }

    // -- Recurring: "this and future" → set stoppedFromPeriod
    if (bill.isRecurring && recurringAction === 'this_and_future' && periodKey) {
      bill.stoppedFromPeriod = periodKey;
      await bill.save();
      return NextResponse.json({ success: true });
    }

    // -- Non-recurring or full delete → remove permanently
    await BillModel.findOneAndDelete({ _id: id, userId: user.id });
    // Clean up any overrides created for this bill
    await BillOverrideModel.deleteMany({ userId: user.id, billId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete bill error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}