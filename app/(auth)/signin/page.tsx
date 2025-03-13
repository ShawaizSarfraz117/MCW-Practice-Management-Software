import Link from 'next/link';
import Image from 'next/image';
import { LoginForm } from '@/components/auth/login-form';

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-800">MCW</h1>
      </div>
      
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold text-center mb-2">Sign in</h2>
        <p className="text-center text-gray-600 mb-6">It's great to see you again</p>
        
        <LoginForm />
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            New here? <Link href="/signup" className="text-blue-600 hover:underline">Create a free account</Link>
          </p>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Can't sign in? <Link href="/help" className="text-blue-600 hover:underline">Get Help</Link>
        </p>
        <p className="text-sm text-gray-500 mt-4">
          © 2023 MCW | <Link href="/terms" className="text-blue-600 hover:underline">Terms</Link> | <Link href="/privacy" className="text-blue-600 hover:underline">Privacy</Link>
        </p>
      </div>
    </div>
  );
} 