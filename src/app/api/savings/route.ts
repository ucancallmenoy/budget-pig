import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { SavingModel } from '@/lib/db/models/Saving';
import { requireAuth } from '@/lib/auth/session';
import { createSavingSchema } from '@/lib/validations/saving';

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

    const savings = await SavingModel.find({
      userId: user.id,
      $or: [
        { monthId },
        { goalType: 'long_term' }
      ],
    }).sort({ createdAt: -1 });

    return NextResponse.json({ savings });
  } catch (error) {
    console.error('Get savings error:', error);
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

    const validation = createSavingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    await connectDB();

     const { goalType, monthId } = validation.data;
    if (goalType === 'monthly' && !monthId) {
      return NextResponse.json(
        { error: 'monthId is required for monthly goals' },
        { status: 400 }
      );
    }

    const saving = await SavingModel.create({
      ...validation.data,
      userId: user.id,
    });

    return NextResponse.json({ saving }, { status: 201 });
  } catch (error) {
    console.error('Create saving error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}