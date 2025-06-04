import { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { User as PrismaUser, Role, UserRole } from "@prisma/client";
import { authorize } from "./auth.service";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string | undefined;
      email?: string | null | undefined;
      roles?: string[];
      isAdmin?: boolean;
      isClinician?: boolean;
    };
  }
  interface User {
    id?: string | undefined;
    email?: string | null | undefined;
    roles?: string[];
  }
}

export type UserWithRoles = PrismaUser & {
  UserRole: (UserRole & {
    Role: Role;
  })[];
};

export const backofficeAuthOptions: AuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize,
    }),
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
        session.user.isAdmin = token.roles
          ? (token.roles as string[]).includes("ADMIN")
          : false;
        session.user.isClinician = token.roles
          ? (token.roles as string[]).includes("CLINICIAN")
          : false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
