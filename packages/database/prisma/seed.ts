import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Create a test user
  const user = await prisma.user.create({
    data: {
      email: "test.clinician@example.com",
      name: "Test Clinician",
      password: "hashed_password", // In production, this should be properly hashed
      role: "CLINICIAN",
    },
  });

  // Create a test clinician
  const clinician = await prisma.clinician.create({
    data: {
      user_id: user.id,
      first_name: "Test",
      last_name: "Clinician",
      address: "123 Test St",
      percentage_split: 70,
      is_active: true,
    },
  });

  console.log("Created test clinician:", clinician);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
