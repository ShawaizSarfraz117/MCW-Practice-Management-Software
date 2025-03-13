import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession();

  if (!session) {
    redirect('/signin');
  }

  // Check if user has either ADMIN or CLINICIAN role
  const isAdmin = session?.user?.isAdmin;
  const isClinician = session?.user?.isClinician;
  
  // Only allow admin and clinician roles to access this layout
  if (!isAdmin && !isClinician) {
    redirect('/client-portal');
  }

  // Pass down the user's roles to the sidebar component
  const roles = session?.user?.roles || [];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 