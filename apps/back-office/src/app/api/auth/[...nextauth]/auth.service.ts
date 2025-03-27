import bcrypt from "bcrypt";
import { RequestInternal } from "next-auth";
import { prisma } from "@mcw/database";

interface UserWithRoles {
  id: string;
  email: string;
  password_hash: string;
  UserRole: {
    Role: {
      name: string;
    };
  }[];
}

export async function authorize(
  credentials: Record<"email" | "password", string> | undefined,
  req: Pick<RequestInternal, "query" | "body" | "headers" | "method">,
) {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  const email = credentials.email.toString();

  // Find user and include their roles
  const user = (await prisma.user.findUnique({
    where: { email },
    include: {
      UserRole: {
        include: {
          Role: true,
        },
      },
    },
  })) as UserWithRoles | null;

  if (!user) {
    return null;
  }

  const plainPassword = credentials.password.toString();
  const hashedPassword = user.password_hash;

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
  const roles = user.UserRole.map((ur) => ur.Role.name);

  return {
    id: user.id,
    email: user.email,
    roles: roles,
  };
}
