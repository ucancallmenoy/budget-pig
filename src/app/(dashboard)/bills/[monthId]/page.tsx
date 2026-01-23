import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { MonthModel } from '@/lib/db/models/Month';
import { BillsView } from '@/view/bills/BillsView';

interface PageProps {
  params: Promise<{
    monthId: string;
  }>;
}

export default async function BillsPage({ params }: PageProps) {
  const user = await requireAuth();
  const { monthId } = await params;

  await connectDB();

  const month = await MonthModel.findOne({ _id: monthId, userId: user.id });

  if (!month) {
    redirect('/dashboard');
  }

  return (
    <BillsView
      monthId={monthId}
      year={month.year}
      month={month.month}
    />
  );
}