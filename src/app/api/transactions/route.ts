import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { TransactionModel } from '@/lib/db/models/Transaction';
import { requireAuth } from '@/lib/auth/session';
import { z } from 'zod';
import { getPeriodForDay } from '@/utils/period';

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  period: z.enum(['P1', 'P2']).optional(),
  type: z
    .enum(['income', 'bill_payment', 'debt_payment', 'savings_contribution', 'expense', 'adjustment'])
    .optional(),
  direction: z.enum(['in', 'out']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      year: searchParams.get('year'),
      month: searchParams.get('month'),
      period: searchParams.get('period') || undefined,
      type: searchParams.get('type') || undefined,
      direction: searchParams.get('direction') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'year and month are required', details: parsed.error.errors },
        { status: 400 },
      );
    }

    const filter: Record<string, unknown> = {
      userId: user.id,
      year: parsed.data.year,
      month: parsed.data.month,
    };
    if (parsed.data.period) {
      filter.period = parsed.data.period;
    }
    if (parsed.data.type) {
      filter.type = parsed.data.type;
    }
    if (parsed.data.direction) {
      filter.direction = parsed.data.direction;
    }

    const transactions = await TransactionModel.find(filter)
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const createTransactionSchema = z.object({
  type: z
    .enum(['income', 'bill_payment', 'debt_payment', 'savings_contribution', 'expense', 'adjustment'])
    .default('income'),
  direction: z.enum(['in', 'out']).default('in'),
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional(),
  period: z.enum(['P1', 'P2']).optional(),
  monthId: z.string().optional(),
  relatedId: z.string().optional(),
  relatedModel: z.enum(['Bill', 'Debt', 'Saving']).optional(),
  category: z.string().optional(),
  description: z.string().min(1, 'Description is required').max(200),
  note: z.string().max(300).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.errors },
        { status: 400 },
      );
    }

    await connectDB();

    const input = parsed.data;

    const effectiveDate = input.date ? new Date(input.date) : new Date();
    if (Number.isNaN(effectiveDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }
    const year = effectiveDate.getFullYear();
    const month = effectiveDate.getMonth() + 1;
    const period = input.period ?? getPeriodForDay(effectiveDate.getDate());

    const transaction = await TransactionModel.create({
      userId: user.id,
      type: input.type,
      direction: input.direction,
      amount: input.amount,
      date: effectiveDate,
      year,
      month,
      period,
      monthId: input.monthId,
      relatedId: input.relatedId,
      relatedModel: input.relatedModel,
      category: input.category,
      description: input.description,
      note: input.note,
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('Create transaction error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
