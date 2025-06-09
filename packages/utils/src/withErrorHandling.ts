import { NextRequest, NextResponse } from "next/server";

/**
 * Generate a unique error ID for tracking
 */
function generateErrorId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `ERR-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
}

/**
 * Format error response based on environment
 */
function formatErrorResponse(
  error: unknown,
  status: number = 500,
): NextResponse {
  const isProduction = process.env.NODE_ENV === "production";
  const errorId = generateErrorId();

  // Log the full error details (server-side only)
  console.error("\n🚨 API Error Caught by withErrorHandling:");
  console.error("📍 Error ID:", errorId);
  console.error("⏰ Timestamp:", new Date().toISOString());
  console.error(
    "🔍 Error Details:",
    error instanceof Error
      ? {
          message: error.message,
          name: error.name,
          stack: error.stack,
        }
      : error,
  );

  if (error instanceof Error && error.stack) {
    console.error("\n📚 Stack Trace:\n", error.stack);
  }
  console.error("-----------------------------------\n");

  if (isProduction) {
    // Production: return sanitized error with ID
    return NextResponse.json(
      {
        error: {
          message: "An error occurred while processing your request",
          issueId: errorId,
        },
      },
      { status },
    );
  } else {
    // Non-production: return full error details
    const errorDetails =
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : { message: String(error) };

    return NextResponse.json(
      {
        error: {
          ...errorDetails,
          issueId: errorId,
          timestamp: new Date().toISOString(),
        },
      },
      { status },
    );
  }
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandling<
  T extends unknown[],
  R extends NextResponse | Response,
>(handler: (request: NextRequest, ...args: T) => Promise<R>) {
  return async (
    request: NextRequest,
    ...args: T
  ): Promise<NextResponse | Response> => {
    try {
      return await handler(request, ...args);
    } catch (error: unknown) {
      return formatErrorResponse(error);
    }
  };
}

// Export for manual use if needed
export { formatErrorResponse, generateErrorId };
