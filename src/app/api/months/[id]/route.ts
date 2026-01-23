import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { MonthModel } from '@/lib/db/models/Month';
import { requireAuth } from '@/lib/auth/session';
import { updateMonthSchema } from '@/lib/validations/month';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    
    await connectDB();

    const month = await MonthModel.findOne({ _id: id, userId: user.id });

    if (!month) {
      return NextResponse.json({ error: 'Month not found' }, { status: 404 });
    }

    return NextResponse.json({ month });
  } catch (error) {
    console.error('Get month error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    const body = await request.json();

    const validation = updateMonthSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    await connectDB();

    const month = await MonthModel.findOneAndUpdate(
      { _id: id, userId: user.id },
      { $set: validation.data },
      { new: true }
    );

    if (!month) {
      return NextResponse.json({ error: 'Month not found' }, { status: 404 });
    }

    return NextResponse.json({ month });
  } catch (error) {
    console.error('Update month error:', error);
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

    const month = await MonthModel.findOneAndDelete({
      _id: id,
      userId: user.id,
    });

    if (!month) {
      return NextResponse.json({ error: 'Month not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete month error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}