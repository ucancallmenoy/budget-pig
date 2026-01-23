import { requireAuth } from '@/lib/auth/session';
import { AnnualDashboardView } from '@/view/dashboard/annual/AnnualDashboardView';

export default async function AnnualDashboardPage() {
  await requireAuth();
  
  const currentYear = new Date().getFullYear();

  return <AnnualDashboardView initialYear={currentYear} />;
}