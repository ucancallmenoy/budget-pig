import { redirect } from 'next/navigation';

export default async function AnnualDashboardPage() {
  redirect('/dashboard/report');
}
