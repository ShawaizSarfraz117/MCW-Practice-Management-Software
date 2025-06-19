import { NextRequest, NextResponse } from "next/server";
import { getBackOfficeSession } from "../../../apps/back-office/src/utils/helpers";
import { createAuditLog } from "../../../apps/back-office/src/utils/audit";

export interface AuditableRouteHandler {
  (request: NextRequest, context?: any): Promise<NextResponse>;
}

interface WithAuditOptions {
  eventType: string;
  getEventText: (req: NextRequest, res?: NextResponse) => string | Promise<string>;
  getClientId?: (req: NextRequest, res?: NextResponse) => string | null | Promise<string | null>;
  isHipaa?: boolean;
  skipOn?: (req: NextRequest, res?: NextResponse) => boolean | Promise<boolean>;
}

/**
 * Wraps an API route handler with automatic audit logging
 * 
 * @example
 * export const POST = withAuditLogging(
 *   async (request) => {
 *     // Your route logic here
 *   },
 *   {
 *     eventType: 'CLIENT_CREATE',
 *     getEventText: (req, res) => `Created new client`,
 *     getClientId: (req, res) => res?.json?.id,
 *     isHipaa: true
 *   }
 * );
 */
export function withAuditLogging(
  handler: AuditableRouteHandler,
  options: WithAuditOptions
): AuditableRouteHandler {
  return async (request: NextRequest, context?: any) => {
    const session = await getBackOfficeSession();
    const userId = session?.user?.id;

    try {
      // Execute the actual route handler
      const response = await handler(request, context);

      // Skip audit logging if configured
      if (options.skipOn && await options.skipOn(request, response)) {
        return response;
      }

      // Extract data for audit log
      const eventText = await Promise.resolve(options.getEventText(request, response));
      const clientId = options.getClientId ? await Promise.resolve(options.getClientId(request, response)) : null;

      createAuditLog({
        user_id: userId,
        client_id: clientId,
        event_type: options.eventType,
        event_text: eventText,
        is_hipaa: options.isHipaa || false,
      }).catch((error) => {
        console.error("Failed to create audit log:", error);
      });
      return response;
    } catch (error) {
      // Still log failed attempts for security
      const failedText = await Promise.resolve(options.getEventText(request));
      createAuditLog({
        user_id: userId,
        client_id: null,
        event_type: options.eventType,
        event_text: `Failed: ${failedText}`,
        is_hipaa: options.isHipaa || false,
      }).catch(console.error);

      throw error;
    }
  };
}

/**
 * Helper to extract client ID from various request patterns
 */
export function extractClientId(request: NextRequest): string | null {
  const url = new URL(request.url);
  
  // Check URL path parameters
  const pathMatch = url.pathname.match(/\/client\/([a-f0-9-]+)/i);
  if (pathMatch) return pathMatch[1];

  // Check query parameters
  const clientId = url.searchParams.get('clientId') || url.searchParams.get('client_id');
  if (clientId) return clientId;

  return null;
}

/**
 * Helper to extract appointment details from request
 */
export async function extractAppointmentDetails(request: NextRequest): Promise<{
  appointmentId?: string;
  clientGroupId?: string;
  clientName?: string;
}> {
  try {
    const body = await request.json();
    return {
      appointmentId: body.id || body.appointmentId,
      clientGroupId: body.clientGroupId || body.client_group_id,
      clientName: body.clientName,
    };
  } catch {
    return {};
  }
}