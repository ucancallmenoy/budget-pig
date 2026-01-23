import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { MonthModel } from '@/lib/db/models/Month';
import { SavingsView } from '@/view/savings/SavingsView';

interface PageProps {
  params: Promise<{
    monthId: string;
  }>;
}

export default async function SavingsPage({ params }: PageProps) {
  const user = await requireAuth();
  const { monthId } = await params;

  await connectDB();

  const month = await MonthModel.findOne({ _id: monthId, userId: user.id });

  if (!month) {
    redirect('/dashboard');
  }

  return (
    <SavingsView
      monthId={monthId}
      year={month.year}
      month={month.month}
    />
  );
}