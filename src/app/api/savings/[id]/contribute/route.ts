import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { SavingModel } from '@/lib/db/models/Saving';
import { SavingContributionModel } from '@/lib/db/models/Contribution';
import { requireAuth } from '@/lib/auth/session';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    const body = await request.json();

    const { amount, note } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid contribution amount' },
        { status: 400 }
      );
    }

    await connectDB();

    const saving = await SavingModel.findOne({ _id: id, userId: user.id });

    if (!saving) {
      return NextResponse.json({ error: 'Saving not found' }, { status: 404 });
    }

    await SavingContributionModel.create({
      savingId: id,
      amount,
      note,
    });

    const newSavedAmount = saving.savedAmount + amount;
    saving.savedAmount = newSavedAmount;

    if (newSavedAmount >= saving.targetAmount && !saving.isCompleted) {
      saving.isCompleted = true;
    }

    await saving.save();

    return NextResponse.json({ saving });
  } catch (error) {
    console.error('Add contribution error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}