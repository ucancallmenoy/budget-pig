import { Sidebar } from '@/components/layout/Sidebar';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentMonth } from '@/utils/date';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Try to extract year/month from the URL
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // Match dashboard routes with year/month
  const dashboardMatch = pathname.match(/\/dashboard\/(\d{4})\/(\d{1,2})/);
  
  let year: number | undefined;
  let month: number | undefined;
  
  if (dashboardMatch) {
    year = parseInt(dashboardMatch[1]);
    month = parseInt(dashboardMatch[2]);
  } else {
    // Default to current month if not on a specific month route
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