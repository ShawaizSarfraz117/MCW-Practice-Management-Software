import { prisma } from "@mcw/database";
import { NextRequest } from "next/server";
import { getClientIP, getLocationFromIP } from "./get-client-info";
import { EntityLookupService } from "./entity-lookup-service";
import { ACTIVITY_TEMPLATES } from "@mcw/types";

export class ActivityService {
  /**
   * Generic method to log any activity
   * @param templateKey - Key from ACTIVITY_TEMPLATES
   * @param context - Object containing entity IDs and values to resolve
   * @param userId - User ID performing the action
   * @param request - NextRequest for IP tracking (optional)
   */
  static async log(
    templateKey: string,
    context: Record<string, unknown>,
    userId?: string,
    request?: NextRequest,
  ): Promise<void> {
    try {
      const template = ACTIVITY_TEMPLATES[templateKey];
      if (!template) {
        console.error(`Activity template not found: ${templateKey}`);
        return;
      }

      // Get IP and location
      let ipAddress: string | undefined;
      let location: string | undefined;
      if (request) {
        ipAddress = getClientIP(request) || undefined;
        if (ipAddress) {
          try {
            location = (await getLocationFromIP(ipAddress)) || undefined;
          } catch (_err) {
            console.debug("Could not get location for activity log");
          }
        }
      }

      // Build the event text
      const eventText = await this.buildEventText(template.template, context);

      // Extract client and client group IDs from context
      const clientId = context.clientId || context.client_id;
      const clientGroupId = context.clientGroupId || context.client_group_id;

      await prisma.audit.create({
        data: {
          event_type: template.entityType.substring(0, 10).toUpperCase(),
          event_text: eventText.substring(0, 255),
          user_id: userId,
          client_id: clientId as string | undefined,
          client_group_id: clientGroupId as string | undefined,
          is_hipaa: template.isHipaa || false,
          ip_address: ipAddress || "",
          location: location,
        },
      });
    } catch (error) {
      console.error("Failed to create activity log entry:", {
        error: error instanceof Error ? error.message : String(error),
        templateKey,
        context,
      });
    }
  }

  /**
   * Build event text by replacing placeholders with actual values
   */
  private static async buildEventText(
    template: string,
    context: Record<string, unknown>,
  ): Promise<string> {
    let eventText = template;

    // Replace placeholders in template
    const placeholderRegex = /\{(\w+)\}/g;
    const placeholders = template.match(placeholderRegex) || [];

    for (const placeholder of placeholders) {
      const key = placeholder.slice(1, -1); // Remove { and }
      let value = context[key];

      if (value === undefined) {
        for (const [contextKey, contextValue] of Object.entries(context)) {
          if (contextKey.endsWith("Id") && typeof contextValue === "string") {
            const entityType = contextKey.replace(/Id$/, "");
            const lookupResult = await EntityLookupService.lookup(
              entityType,
              contextValue,
            );

            if (lookupResult && lookupResult[key]) {
              value = lookupResult[key];
              break;
            }
          }
        }
      }

      // Format dates and times
      if (key === "date" && context.startDate) {
        value = new Date(context.startDate as string | Date).toLocaleDateString(
          "en-US",
        );
      } else if (key === "time" && context.startDate) {
        value = new Date(context.startDate as string | Date).toLocaleTimeString(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          },
        );
      } else if (key === "changes" && context.changes) {
        const changeDescriptions: string[] = [];
        const changes = context.changes as Record<string, unknown>;
        for (const [field, newValue] of Object.entries(changes)) {
          changeDescriptions.push(`${field.replace(/_/g, " ")} to ${newValue}`);
        }
        value =
          changeDescriptions.length > 0
            ? `(${changeDescriptions.join(", ")})`
            : "";
      }

      // Replace placeholder with value or "Unknown"
      eventText = eventText.replace(
        placeholder,
        value !== undefined ? String(value) : "Unknown",
      );
    }

    return eventText;
  }

  /**
   * Convenience method for logging with entity resolution
   */
  static async logWithDetails(
    templateKey: string,
    entityId: string | undefined,
    context: Record<string, unknown>,
    userId?: string,
    request?: NextRequest,
  ): Promise<void> {
    const enrichedContext = { ...context };

    // Add entity ID to context
    if (entityId) {
      enrichedContext.entityId = entityId;
    }

    await this.log(templateKey, enrichedContext, userId, request);
  }

  /**
   * Quick log method for simple activities
   */
  static async quickLog(
    entityType: string,
    action: string,
    description: string,
    userId?: string,
    request?: NextRequest,
    options?: {
      entityId?: string;
      clientId?: string;
      clientGroupId?: string;
      isHipaa?: boolean;
    },
  ): Promise<void> {
    try {
      // Get IP and location
      let ipAddress: string | undefined;
      let location: string | undefined;
      if (request) {
        ipAddress = getClientIP(request) || undefined;
        if (ipAddress) {
          try {
            location = (await getLocationFromIP(ipAddress)) || undefined;
          } catch (_err) {
            console.debug("Could not get location for activity log");
          }
        }
      }

      await prisma.audit.create({
        data: {
          event_type: entityType.substring(0, 10).toUpperCase(),
          event_text: description.substring(0, 255),
          user_id: userId,
          client_id: options?.clientId,
          client_group_id: options?.clientGroupId,
          is_hipaa: options?.isHipaa || false,
          ip_address: ipAddress || "",
          location: location,
        },
      });
    } catch (error) {
      console.error("Failed to create quick activity log entry:", {
        error: error instanceof Error ? error.message : String(error),
        entityType,
        action,
        description,
      });
    }
  }
}

export { EntityLookupService, ACTIVITY_TEMPLATES };
