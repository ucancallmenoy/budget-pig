import { redirect } from 'next/navigation';
import { getCurrentMonth } from '@/utils/date';
import { requireAuth } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { MonthModel } from '@/lib/db/models/Month';
import { MonthlyDashboardView } from '@/view/dashboard/monthly/MonthlyDashboardView';

export default async function DashboardPage() {
  const user = await requireAuth();
  const { year, month } = getCurrentMonth();

  await connectDB();

  // Find or create current month
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

  return (
    <MonthlyDashboardView
      monthId={currentMonth._id.toString()}
      year={year}
      month={month}
    />
  );
}