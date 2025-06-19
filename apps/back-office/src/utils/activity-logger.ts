import { getServerSession } from "next-auth";
import { backofficeAuthOptions } from "@/api/auth/[...nextauth]/auth-options";
import { ActivityService, ACTIVITY_TEMPLATES } from "@mcw/utils/server";
import { NextRequest } from "next/server";

export class ActivityLogger {
  static async log(
    templateKey: string,
    context: Record<string, unknown>,
    request?: NextRequest,
  ): Promise<void> {
    try {
      const session = await getServerSession(backofficeAuthOptions);
      const userId = session?.user?.id;

      await ActivityService.log(templateKey, context, userId, request);
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }

  /**
   * Log activity with entity details
   */
  static async logWithDetails(
    templateKey: string,
    entityId: string | undefined,
    context: Record<string, unknown>,
    request?: NextRequest,
  ): Promise<void> {
    try {
      const session = await getServerSession(backofficeAuthOptions);
      const userId = session?.user?.id;

      await ActivityService.logWithDetails(
        templateKey,
        entityId,
        context,
        userId,
        request,
      );
    } catch (error) {
      console.error("Failed to log activity with details:", error);
    }
  }

  /**
   * Quick log for simple activities
   */
  static async quickLog(
    entityType: string,
    action: string,
    description: string,
    request?: NextRequest,
    options?: {
      entityId?: string;
      clientId?: string;
      clientGroupId?: string;
      isHipaa?: boolean;
    },
  ): Promise<void> {
    try {
      const session = await getServerSession(backofficeAuthOptions);
      const userId = session?.user?.id;

      await ActivityService.quickLog(
        entityType,
        action,
        description,
        userId,
        request,
        options,
      );
    } catch (error) {
      console.error("Failed to quick log activity:", error);
    }
  }
}

// Export activity templates for reference
export { ACTIVITY_TEMPLATES };
