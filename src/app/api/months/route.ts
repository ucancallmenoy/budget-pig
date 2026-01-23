import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { MonthModel } from '@/lib/db/models/Month';
import { requireAuth } from '@/lib/auth/session';
import { createMonthSchema } from '@/lib/validations/month';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    const query: Record<string, unknown> = { userId: user.id };
    if (year) {
      query.year = parseInt(year);
    }

    const months = await MonthModel.find(query).sort({ year: -1, month: -1 });

    return NextResponse.json({ months });
  } catch (error) {
    console.error('Get months error:', error);
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

    const validation = createMonthSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    await connectDB();

    const { year, month, totalIncome } = validation.data;

    // Check if month already exists
    const existingMonth = await MonthModel.findOne({
      userId: user.id,
      year,
      month,
    });

    if (existingMonth) {
      return NextResponse.json(
        { error: 'Month already exists' },
        { status: 409 }
      );
    }

    const newMonth = await MonthModel.create({
      userId: user.id,
      year,
      month,
      totalIncome,
    });

    return NextResponse.json({ month: newMonth }, { status: 201 });
  } catch (error) {
    console.error('Create month error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}