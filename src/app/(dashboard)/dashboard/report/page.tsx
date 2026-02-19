import { requireAuth } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { MonthModel } from '@/lib/db/models/Month';
import { MonthlyReportView } from '@/view/dashboard/annual/MonthlyReportView';
import { getCurrentMonth } from '@/utils/date';
import { cookies } from 'next/headers';

export default async function MonthlyReportPage() {
  const user = await requireAuth();

  const cookieStore = await cookies();
  const selectedYearCookie = cookieStore.get('selectedYear')?.value;
  const selectedMonthCookie = cookieStore.get('selectedMonth')?.value;

  let { year, month } = getCurrentMonth();

  if (selectedYearCookie && selectedMonthCookie) {
    year = parseInt(selectedYearCookie, 10);
    month = parseInt(selectedMonthCookie, 10);
  }

  await connectDB();

  let selectedMonth = await MonthModel.findOne({
    userId: user.id,
    year,
    month,
  });

  if (!selectedMonth) {
    selectedMonth = await MonthModel.create({
      userId: user.id,
      year,
      month,
      totalIncome: 0,
    });
  }

  return (
    <MonthlyReportView
      monthId={selectedMonth._id.toString()}
      year={year}
      month={month}
    />
  );
}
