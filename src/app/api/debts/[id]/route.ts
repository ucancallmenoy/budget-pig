import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { DebtModel } from '@/lib/db/models/Debt';
import { requireAuth } from '@/lib/auth/session';
import { updateDebtSchema } from '@/lib/validations/debt';

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

    const validation = updateDebtSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    await connectDB();

    const debt = await DebtModel.findOneAndUpdate(
      { _id: id, userId: user.id },
      { $set: validation.data },
      { new: true }
    );

    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    return NextResponse.json({ debt });
  } catch (error) {
    console.error('Update debt error:', error);
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

    const debt = await DebtModel.findOneAndDelete({
      _id: id,
      userId: user.id,
    });

    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete debt error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}