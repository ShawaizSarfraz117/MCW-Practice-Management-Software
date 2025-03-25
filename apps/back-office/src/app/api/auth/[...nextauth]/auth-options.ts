import { AuthOptions } from "next-auth";
import Credentials from 'next-auth/providers/credentials';
import { PrismaClient, User as PrismaUser, Role, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string | undefined;
      email?: string | null | undefined;
      roles?: string[];
      isAdmin?: boolean;
      isClinician?: boolean;
    }
  }
  interface User {
    id?: string | undefined;
    email?: string | null | undefined;
    roles?: string[];
  }
}

type UserWithRoles = PrismaUser & {
  UserRole: (UserRole & {
    Role: Role;
  })[];
};

export const backofficeAuthOptions: AuthOptions = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toString();
        
        // Find user and include their roles
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            UserRole: {
              include: {
                Role: true,
              },
            },
          },
        }) as UserWithRoles | null;
        
        if (!user) {
          return null;
        }
        
        const plainPassword = credentials.password.toString();
        const hashedPassword = user.password_hash;
        
        const isValid = await bcrypt.compare(plainPassword, hashedPassword);
        console.log("🚀 ~ authorize ~ user:", isValid)
        
        if (!isValid) {
          return null;
        }

        // Update last_login timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { last_login: new Date() },
        });

        // Extract role names from user's roles
        const roles = user.UserRole.map((ur) => ur.Role.name);

        return {
          id: user.id,
          email: user.email,
          roles: roles,
        };
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as string[];
        session.user.isAdmin = token.roles ? (token.roles as string[]).includes('ADMIN') : false;
        session.user.isClinician = token.roles ? (token.roles as string[]).includes('CLINICIAN') : false;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: "jwt",
  },
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
}; 