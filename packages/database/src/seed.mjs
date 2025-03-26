import { prisma } from "@mcw/database";
import bcrypt from "bcrypt";

await prisma.user.create({
  data: {
    email: "test@test.com",
    password_hash: bcrypt.hashSync("test", 10),
  },
});
