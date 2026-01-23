import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { MonthModel } from '@/lib/db/models/Month';
import { MonthlyDashboardView } from '@/view/dashboard/monthly/MonthlyDashboardView';

interface PageProps {
  params: Promise<{
    year: string;
    month: string;
  }>;
}

export default async function SpecificMonthPage({ params }: PageProps) {
  const user = await requireAuth();
  const { year: yearStr, month: monthStr } = await params;

  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    redirect('/dashboard');
  }

  await connectDB();

  // Find or create the month
  let monthData = await MonthModel.findOne({
    userId: user.id,
    year,
    month,
  });

  if (!monthData) {
    monthData = await MonthModel.create({
      userId: user.id,
      year,
      month,
      totalIncome: 0,
    });
  }

  return (
    <MonthlyDashboardView
      monthId={monthData._id.toString()}
      year={year}
      month={month}
    />
  );
}