import { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

const prisma = new PrismaClient();

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        
        // Find user and include their roles
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        });

        if (!user) {
          return null;
        }
        
        const plainPassword = credentials.password as string;
        const hashedPassword = user.password_hash as string;
        
        const isValid = await bcrypt.compare(plainPassword, hashedPassword);
        
        if (!isValid) {
          return null;
        }

        // Update last_login timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { last_login: new Date() },
        });

        // Extract role names from user's roles
        const roles = user.userRoles.map(ur => ur.role.name);

        return {
          id: user.id,
          email: user.email,
          roles: roles,
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT, user: any }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
      }
      return token;
    },
    async session({ session, token }: { session: Session, token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as string[];
        // Check for admin role
        session.user.isAdmin = token.roles ? (token.roles as string[]).includes('ADMIN') : false;
        // Check for clinician role
        session.user.isClinician = token.roles ? (token.roles as string[]).includes('CLINICIAN') : false;
      }
      return session;
    }
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 