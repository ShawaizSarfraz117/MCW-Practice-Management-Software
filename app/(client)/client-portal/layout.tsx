import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { ClientHeader } from '@/components/client/client-header';
import { ClientSidebar } from '@/components/client/client-sidebar';

interface ClientPortalLayoutProps {
  children: ReactNode;
}

export default async function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const session = await getServerSession();

  if (!session) {
    redirect('/signin');
  }

  // Only allow clients to access this layout
  const isAdmin = session?.user?.isAdmin;
  const isClinician = session?.user?.isClinician;
  
  // If user has admin or clinician role, redirect to dashboard
  if (isAdmin || isClinician) {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ClientSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <ClientHeader user={session.user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 