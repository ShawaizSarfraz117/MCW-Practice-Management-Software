import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@mcw/database";

// Define a type for your app's specific User model fields if needed beyond default NextAuthUser
// interface AppUser extends NextAuthUser {
//   // Add any custom fields you expect on the user object from Prisma
// }

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: "smtp.gmail.com",
        port: 465, // Common for SMTPS (SSL)
        auth: {
          user: "talhanaseeb27@gmail.com", // Your Gmail address
          pass: "otekvnfazpoloysc", // Your Gmail App Password
        },
      },
      from: "talhanaseeb27@gmail.com", // Sender address
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      // user object is only available on initial sign-in or account linking.
      if (user?.id) {
        // PrismaAdapter should provide id, name, email, image from your User model
        token.id = user.id;
        token.name = user.name; // Persist name to token
        token.email = user.email; // Persist email to token (already there by default but good to be explicit)
      }
      return token;
    },
    async session({ session, token }) {
      // The token object here is what was returned from the jwt callback
      if (session.user) {
        if (token.id) session.user.id = token.id as string;
        if (token.name) session.user.name = token.name as string;
        // session.user.email is usually populated by default from token.email
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // user here should be the user from the database via adapter
      if (user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { last_login: new Date() },
          });
          console.log(`[Auth Event] Updated last_login for user: ${user.id}`);
        } catch (error) {
          console.error("[Auth Event] Failed to update last_login:", error);
        }
      }
    },
  },
  // debug: process.env.NODE_ENV === "development",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
