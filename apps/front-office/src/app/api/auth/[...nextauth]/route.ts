import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@mcw/database";
import { createTransport } from "nodemailer";

const transporter = createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: true,
});

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      maxAge: 24 * 60 * 60, // 24 hours
      async sendVerificationRequest({ identifier: email, url }) {
        // Get email template from database
        const template = await prisma.template.findFirst({
          where: {
            type: "EMAIL",
            name: "MAGIC_LINK",
          },
        });

        if (!template) {
          throw new Error("Email template not found");
        }

        // Replace placeholders in template
        const html = template.content
          .replace("{{magic_link}}", url)
          .replace("{{email}}", email);

        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: "Sign in to McNulty Counseling and Wellness",
          html,
        });
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
  },
  callbacks: {
    async signIn({ user }) {
      // Check if user exists in Client table
      const client = await prisma.user.findFirst({
        where: {
          email: user.email!,
          UserRole: {
            some: {
              Role: {
                name: "CLIENT",
              },
            },
          },
        },
      });

      if (!client) {
        return false; // Prevent sign in if not a registered client
      }

      return true;
    },
    async session({ session, user }) {
      // Skip query if email is missing
      if (!user.email) {
        return session;
      }

      // Add client ID to session
      try {
        // Optimize query to only fetch the ID
        const client = await prisma.user.findFirst({
          where: {
            email: user.email,
            UserRole: {
              some: {
                Role: {
                  name: "CLIENT",
                },
              },
            },
          },
          select: {
            id: true,
          },
        });

        return {
          ...session,
          user: {
            ...session.user,
            clientId: client?.id,
          },
        };
      } catch (error) {
        console.error(`Error fetching client ID for session ${user.email}:`, error);
        return session; // Return session without clientId on error
      }
    },
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
