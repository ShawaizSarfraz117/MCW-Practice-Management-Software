import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    roles?: string[];
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      roles?: string[];
      isAdmin?: boolean;
      isClinician?: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    roles?: string[];
  }
} 