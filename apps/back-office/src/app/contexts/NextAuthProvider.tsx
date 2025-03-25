/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

// Third-party Imports
import { SessionProvider } from 'next-auth/react'

// Add the type for children
interface NextAuthProviderProps {
  children: React.ReactNode;
}

export const NextAuthProvider = ({ children, ...rest }: NextAuthProviderProps) => {
  return <SessionProvider {...rest}>{children}</SessionProvider>;
}
