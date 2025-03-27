import NextAuth from "next-auth";
import { backofficeAuthOptions } from "./auth-options";

const handler = NextAuth(backofficeAuthOptions);

export { handler as GET, handler as POST };
