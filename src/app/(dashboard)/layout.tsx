import { Sidebar } from '@/components/layout/Sidebar';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentMonth } from '@/utils/date';
import { cookies } from 'next/headers';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  const cookieStore = await cookies();
  const selectedYearCookie = cookieStore.get('selectedYear')?.value;
  const selectedMonthCookie = cookieStore.get('selectedMonth')?.value;
  
  let year: number | undefined;
  let month: number | undefined;
  
  if (selectedYearCookie && selectedMonthCookie) {
    year = parseInt(selectedYearCookie);
    month = parseInt(selectedMonthCookie);
  } else {
    const current = getCurrentMonth();
    year = current.year;
    month = current.month;
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar currentYear={year} currentMonth={month} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}