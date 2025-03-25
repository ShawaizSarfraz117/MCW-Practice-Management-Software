import { type AuthOptions } from 'next-auth';
import { PrismaClient } from "@prisma/client";

// Safe compare function that works in both client and server environments
let compare = async (_data: string, _hash: string): Promise<boolean> => {
  console.warn('Using fallback password comparison - bcrypt not available');
  // This fallback should only run on client - actual comparison happens server-side
  return false;
};

// Server-side only code
if (typeof window === 'undefined') {
  // In a server environment, we can safely use dynamic imports
  import('bcrypt')
    .then(bcrypt => {
      compare = bcrypt.compare;
    })
    .catch(error => {
      console.warn('Failed to load bcrypt, using fallback comparison', error);
    });
}

// Use a safe approach for Prisma initialization - server-side only
let prisma: any = null;
if (typeof window === 'undefined') {
  prisma = new PrismaClient();
} else {
  // Mock client for client-side
  prisma = {
    user: {
      findUnique: async () => null
    }
  };
}

// Auth configuration for both API routes and Next.js App Router
export const authConfig: AuthOptions = {
  providers: [
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password_hash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email
        };
      }
    }
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  }
};

// Legacy export for getServerSession
export const authOptions = authConfig;

// Export auth function for App Router
export const auth = async () => {
  // This is a simplified auth function
  // In a production app, this would use the actual NextAuth.js mechanism
  return { 
    user: { 
      id: "mock-user-id", 
      email: "user@example.com" 
    } 
  };
}; 