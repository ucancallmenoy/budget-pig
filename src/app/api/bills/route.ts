import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { BillModel } from '@/lib/db/models/Bill';
import { MonthModel } from '@/lib/db/models/Month';
import { BillOverrideModel } from '@/lib/db/models/BillOverride';
import { requireAuth } from '@/lib/auth/session';
import { createBillSchema } from '@/lib/validations/bill';
import { type ViewMode, isDueDateInViewMode, buildPeriodKey, type Period } from '@/utils/period';

/**
 * Merge BillOverride docs onto their parent bills for a given periodKey.
 * If an override has `isSuppressed: true` the bill is removed entirely.
 */
function applyOverrides(
  bills: Record<string, unknown>[],
  overrides: Map<string, { isSuppressed: boolean; overrides?: Record<string, unknown> }>,
): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  for (const bill of bills) {
    const billId = String((bill as { _id: unknown })._id);
    const ov = overrides.get(billId);
    if (ov?.isSuppressed) continue;          // hidden for this period
    if (ov?.overrides) Object.assign(bill, ov.overrides); // field overrides
    result.push(bill);
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const monthId = searchParams.get('monthId');
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    const viewMode = (searchParams.get('viewMode') || 'monthly') as ViewMode;

    // Helper: load overrides for a set of bill ids + periodKey
    async function loadOverrides(billIds: string[], periodKey: string) {
      if (!periodKey || viewMode === 'monthly') return new Map<string, { isSuppressed: boolean; overrides?: Record<string, unknown> }>();
      const docs = await BillOverrideModel.find({
        userId: user.id,
        billId: { $in: billIds },
        periodKey,
      }).lean();
      const map = new Map<string, { isSuppressed: boolean; overrides?: Record<string, unknown> }>();
      for (const d of docs) {
        map.set(String(d.billId), { isSuppressed: d.isSuppressed, overrides: d.overrides as Record<string, unknown> | undefined });
      }
      return map;
    }

    if (monthId) {
      const currentMonth = await MonthModel.findOne({ _id: monthId, userId: user.id });

      if (!currentMonth) {
        return NextResponse.json({ error: 'Month not found' }, { status: 404 });
      }

      const { year, month } = currentMonth;
      const periodKey = viewMode !== 'monthly' ? buildPeriodKey(year, month, viewMode as Period) : '';

      const monthBills = await BillModel.find({ userId: user.id, monthId }).sort({ dueDate: 1 });

      const allPreviousMonths = await MonthModel.find({
        userId: user.id,
        $or: [{ year: { $lt: year } }, { year, month: { $lt: month } }],
      }).sort({ year: 1, month: 1 });

      let recurringBills: typeof monthBills = [];
      if (allPreviousMonths.length > 0) {
        const previousMonthIds = allPreviousMonths.map(m => m._id.toString());
        recurringBills = await BillModel.find({
          userId: user.id,
          monthId: { $in: previousMonthIds },
          isRecurring: true,
        });
      }

      // Merge bills: month-specific bills take priority
      const billMap = new Map<string, Record<string, unknown>>();

      monthBills.forEach(bill => {
        billMap.set(bill._id.toString(), bill.toObject() as unknown as Record<string, unknown>);
      });

      recurringBills.forEach(bill => {
        if (!billMap.has(bill._id.toString())) {
          // Skip if recurring bill was stopped before this period
          if (bill.stoppedFromPeriod) {
            const currentKey = buildPeriodKey(year, month);
            if (currentKey >= bill.stoppedFromPeriod) return;
          }
          const billObj = bill.toObject() as unknown as Record<string, unknown>;
          billObj.monthId = monthId;
          billMap.set(bill._id.toString(), billObj);
        }
      });

      let allBills = Array.from(billMap.values());

      // Apply period overrides
      if (periodKey) {
        const billIds = allBills.map(b => String((b as { _id: unknown })._id));
        const overrides = await loadOverrides(billIds, periodKey);
        allBills = applyOverrides(allBills, overrides);
      }

      // Filter by viewMode (period)
      allBills = allBills.filter(b => isDueDateInViewMode((b as { dueDate: number }).dueDate, year, month, viewMode));
      allBills.sort((a, b) => (a as { dueDate: number }).dueDate - (b as { dueDate: number }).dueDate);

      return NextResponse.json({ bills: allBills });
    }

    if (yearParam && monthParam) {
      const year = parseInt(yearParam);
      const month = parseInt(monthParam);
      const periodKey = viewMode !== 'monthly' ? buildPeriodKey(year, month, viewMode as Period) : '';

      let currentMonth = await MonthModel.findOne({ userId: user.id, year, month });

      if (!currentMonth) {
        currentMonth = await MonthModel.create({ userId: user.id, year, month, totalIncome: 0 });
      }

      const effMonthId = currentMonth._id.toString();
      const monthBills = await BillModel.find({ userId: user.id, monthId: effMonthId }).sort({ dueDate: 1 });

      const allPreviousMonths = await MonthModel.find({
        userId: user.id,
        $or: [{ year: { $lt: year } }, { year, month: { $lt: month } }],
      }).sort({ year: 1, month: 1 });

      let recurringBills: typeof monthBills = [];
      if (allPreviousMonths.length > 0) {
        const previousMonthIds = allPreviousMonths.map(m => m._id.toString());
        recurringBills = await BillModel.find({
          userId: user.id,
          monthId: { $in: previousMonthIds },
          isRecurring: true,
        });
      }

      const billMap = new Map<string, Record<string, unknown>>();

      monthBills.forEach(bill => {
        billMap.set(bill._id.toString(), bill.toObject() as unknown as Record<string, unknown>);
      });

      recurringBills.forEach(bill => {
        if (!billMap.has(bill._id.toString())) {
          if (bill.stoppedFromPeriod) {
            const currentKey = buildPeriodKey(year, month);
            if (currentKey >= bill.stoppedFromPeriod) return;
          }
          const billObj = bill.toObject() as unknown as Record<string, unknown>;
          billObj.monthId = effMonthId;
          billMap.set(bill._id.toString(), billObj);
        }
      });

      let allBills = Array.from(billMap.values());

      // Apply period overrides
      if (periodKey) {
        const billIds = allBills.map(b => String((b as { _id: unknown })._id));
        const overrides = await loadOverrides(billIds, periodKey);
        allBills = applyOverrides(allBills, overrides);
      }

      // Filter by viewMode (period)
      allBills = allBills.filter(b => isDueDateInViewMode((b as { dueDate: number }).dueDate, year, month, viewMode));
      allBills.sort((a, b) => (a as { dueDate: number }).dueDate - (b as { dueDate: number }).dueDate);

      return NextResponse.json({ bills: allBills });
    }

    return NextResponse.json({ error: 'monthId or year and month are required' }, { status: 400 });
  } catch (error) {
    console.error('Get bills error:', error);
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