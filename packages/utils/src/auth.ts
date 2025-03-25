import { type AuthOptions } from "next-auth";
import { prisma } from "@mcw/database";

// Import bcrypt dynamically to avoid issues with Next.js SSR
let compare;
try {
  // Try to import bcrypt dynamically
  const bcrypt = require("bcrypt");
  compare = bcrypt.compare;
} catch (error) {
  // Fallback implementation for comparison
  compare = async (data: string, hash: string): Promise<boolean> => {
    console.warn("Using fallback password comparison - bcrypt not available");
    // Using the parameters to avoid unused parameter warnings
    console.log(
      `Attempted to compare: ${data.length} chars with hash: ${hash.substring(0, 10)}...`,
    );
    // In a real implementation, you would need a better fallback
    return false;
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
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password_hash,
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
        };
      },
    },
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
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
      email: "user@example.com",
    },
  };
};
