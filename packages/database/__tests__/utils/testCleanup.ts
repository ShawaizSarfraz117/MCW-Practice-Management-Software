import { PrismaClient } from "@prisma/client";

/**
 * Shared database cleanup utility for integration tests.
 * Deletes all test data in the correct order to avoid foreign key constraint violations.
 */

export interface CleanupOptions {
  /**
   * Skip environment safety checks (use with caution)
   */
  skipSafetyChecks?: boolean;
  /**
   * Log deletion progress
   */
  verbose?: boolean;
}

/**
 * Clean up all test data from the database in the correct order
 * to avoid foreign key constraint violations.
 *
 * Deletion order is based on dependency levels:
 * Level 1: Leaf tables with no dependents
 * Level 2: Tables that depend on Level 3+
 * Level 3: Tables that depend on Level 4+
 * Level 4: Tables that depend on Level 5+
 * Level 5: Core entities
 * Level 6: Foundation tables (User, Role, etc.)
 */
export async function cleanupDatabase(
  prisma: PrismaClient,
  options: CleanupOptions = {},
): Promise<void> {
  const { verbose = false } = options;

  const log = (message: string) => {
    if (verbose) {
      console.log(`[DB Cleanup] ${message}`);
    }
  };

  try {
    await prisma.$transaction(
      async (tx) => {
        log("Starting database cleanup...");

        // Level 0: Clear foreign key references first
        log("Level 0: Clearing foreign key references...");
        await tx.appointment.updateMany({
          data: { superbill_id: null },
        });

        // Level 1: Leaf tables (no other tables depend on these)
        log("Level 1: Cleaning leaf tables...");
        await Promise.all([
          tx.appointmentTag.deleteMany(),
          tx.audit.deleteMany(),
          tx.clientFiles.deleteMany(),
          tx.clientGroupFile.deleteMany(),
          tx.rolePermission.deleteMany(),
          tx.userRole.deleteMany(),
          tx.clientProfile.deleteMany(),
          tx.clientAdress.deleteMany(),
          tx.clientReminderPreference.deleteMany(),
          tx.clientGroupMembership.deleteMany(),
          tx.clientContact.deleteMany(),
        ]);

        // Level 2: Tables dependent on Level 3+ tables
        log("Level 2: Cleaning dependent tables...");
        await Promise.all([
          tx.payment.deleteMany(),
          tx.superbill.deleteMany(),
          tx.statement.deleteMany(),
          tx.invoice.deleteMany(),
          tx.surveyAnswers.deleteMany(),
        ]);

        // Level 3: Tables dependent on Level 4+ tables
        log("Level 3: Cleaning core dependent tables...");
        await Promise.all([
          tx.appointment.deleteMany(),
          tx.availability.deleteMany(),
          tx.clinicianServices.deleteMany(),
          tx.clinicianLocation.deleteMany(),
        ]);

        // Level 4: Tables dependent on Level 5+ tables
        log("Level 4: Cleaning group and service tables...");
        await Promise.all([
          tx.clientGroup.deleteMany(),
          tx.practiceService.deleteMany(),
          tx.tag.deleteMany(),
          tx.emailTemplate.deleteMany(),
        ]);

        // Level 5: Core entity tables (includes entities with user dependencies)
        log("Level 5: Cleaning core entities...");
        await Promise.all([
          tx.client.deleteMany(),
          tx.location.deleteMany(),
          tx.product.deleteMany(),
          tx.license.deleteMany(),
        ]);

        // Level 6: User-dependent entities (must be deleted before user)
        log("Level 6: Cleaning user-dependent entities...");
        await tx.clinician.deleteMany();

        // Level 7: Foundation tables (least dependent)
        log("Level 7: Cleaning foundation tables...");
        await Promise.all([
          tx.user.deleteMany(),
          tx.role.deleteMany(),
          tx.permission.deleteMany(),
        ]);

        log("Database cleanup completed successfully.");
      },
      {
        timeout: 30000, // Increase timeout to 30 seconds for extensive cleanup
      },
    );
  } catch (error) {
    console.error("Error during database cleanup:", error);
    throw new Error(
      `Database cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Clean up test data for a specific user and their related entities.
 * Useful for targeted cleanup in tests.
 */
export async function cleanupTestUserData(
  prisma: PrismaClient,
  userId: string,
  options: CleanupOptions = {},
): Promise<void> {
  const { verbose = false } = options;

  const log = (message: string) => {
    if (verbose) {
      console.log(`[User Cleanup] ${message}`);
    }
  };

  try {
    await prisma.$transaction(
      async (tx) => {
        log(`Cleaning up data for user: ${userId}`);

        // Get user's clinician record if exists
        const clinician = await tx.clinician.findFirst({
          where: { user_id: userId },
          select: { id: true },
        });

        if (clinician) {
          log("Found clinician record, cleaning up related data...");

          // Clean up appointments where this clinician is assigned
          await tx.appointment.deleteMany({
            where: { clinician_id: clinician.id },
          });

          // Clean up availability records
          await tx.availability.deleteMany({
            where: { clinician_id: clinician.id },
          });

          // Clean up practice services linked to clinician through ClinicianServices
          await tx.clinicianServices.deleteMany({
            where: { clinician_id: clinician.id },
          });

          // Delete the clinician record
          await tx.clinician.delete({
            where: { id: clinician.id },
          });
        }

        // Clean up user roles
        await tx.userRole.deleteMany({
          where: { user_id: userId },
        });

        // Clean up audit records
        await tx.audit.deleteMany({
          where: { user_id: userId },
        });

        // Clean up superbills created by this user
        await tx.superbill.deleteMany({
          where: { created_by: userId },
        });

        // Finally, delete the user
        await tx.user.delete({
          where: { id: userId },
        });

        log(`User cleanup completed for: ${userId}`);
      },
      {
        timeout: 15000, // 15 seconds timeout for user-specific cleanup
      },
    );
  } catch (error) {
    console.error(`Error during user cleanup for ${userId}:`, error);
    throw new Error(
      `User cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Safe wrapper for cleanupDatabase that includes environment checks.
 * Only runs in test environments to prevent accidental use in production.
 */
export async function safeCleanupDatabase(
  prisma: PrismaClient,
  options: CleanupOptions = {},
): Promise<void> {
  const { skipSafetyChecks = false } = options;

  if (!skipSafetyChecks) {
    // Check if we're in a test environment
    const isTestEnv = process.env.NODE_ENV === "test";
    const isTestDB =
      process.env.DATABASE_URL?.includes(":1434") || // Test DB port
      process.env.DATABASE_URL?.includes("test") || // Test in DB name
      process.env.DATABASE_URL?.includes("mcw-dev"); // Dev DB

    if (!isTestEnv && !isTestDB) {
      throw new Error(
        "safeCleanupDatabase can only be used in test environments. " +
          "Set NODE_ENV=test or use a test database (port 1434) or use skipSafetyChecks=true",
      );
    }
  }

  await cleanupDatabase(prisma, options);
}
