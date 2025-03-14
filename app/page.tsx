import { redirect } from 'next/navigation';
import  getServerSession  from 'next-auth'; 
import { backofficeAuthOptions } from '@/app/api/backoffice/auth/[...nextauth]/auth-options';

// Define a type for the session to help TypeScript
interface SessionUser {
  user?: {
    isAdmin?: boolean;
    isClinician?: boolean;
  } | null;
}

export default async function Home() {
  // Use type assertion to help TypeScript understand the structure
  const session = await getServerSession(backofficeAuthOptions) as SessionUser | null;

  if (!session) {
    redirect('/backoffice/signin');
  }

  // Check if user has admin or clinician roles
  const isAdmin = session?.user?.isAdmin;
  const isClinician = session?.user?.isClinician;
  
  if (isAdmin || isClinician) {
    redirect('/dashboard');
  } else {
    redirect('/client-portal');
  }
  return null;
}