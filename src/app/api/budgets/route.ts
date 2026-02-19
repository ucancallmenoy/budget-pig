import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { CategoryBudgetModel } from '@/lib/db/models/CategoryBudget';
import { requireAuth } from '@/lib/auth/session';
import {
  createCategoryBudgetSchema,
  updateCategoryBudgetSchema,
} from '@/lib/validations/budget';

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
        { status: 400 },
      );
    }

    const budgets = await CategoryBudgetModel.find({
      userId: user.id,
      year: parseInt(year),
      month: parseInt(month),
    }).sort({ category: 1 });

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error('Get budgets error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validation = createCategoryBudgetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 },
      );
    }

    await connectDB();

    const budget = await CategoryBudgetModel.findOneAndUpdate(
      {
        userId: user.id,
        year: validation.data.year,
        month: validation.data.month,
        category: validation.data.category,
      },
      { $set: { budgetAmount: validation.data.budgetAmount } },
      { upsert: true, new: true },
    );

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    console.error('Create budget error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
