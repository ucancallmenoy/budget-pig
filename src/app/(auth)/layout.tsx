import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Redirect to dashboard if already authenticated
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main>{children}</main>
    </div>
  );
}