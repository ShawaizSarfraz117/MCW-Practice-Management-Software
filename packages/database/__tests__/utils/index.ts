/**
 * Test utilities for database operations
 * ⚠️  WARNING: TEST-ONLY UTILITIES ⚠️
 *
 * These utilities are designed ONLY for testing environments.
 * They perform destructive operations on database data.
 *
 * NEVER import these utilities in production code.
 * They are located in __tests__ folder to prevent accidental inclusion in builds.
 */

export {
  cleanupDatabase,
  cleanupTestUserData,
  safeCleanupDatabase,
} from "./testCleanup";

export type { CleanupOptions } from "./testCleanup";
