import { NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

/**
 * GET /api/products
 * Retrieves all products from the database.
 */
export async function GET() {
  try {
    logger.info("Fetching all products");
    const products = await prisma.product.findMany({
      orderBy: {
        name: "asc", // Optional: Order products by name
      },
    });
    logger.info(`Found ${products.length} products`);
    return NextResponse.json(products);
  } catch (error) {
    // Log the error object first, then the message
    logger.error(error as Error, "Failed to fetch products");
    // In a real application, you might want to distinguish between different error types
    // and return more specific status codes or error messages.
    return NextResponse.json(
      { error: "Failed to fetch products." },
      { status: 500 },
    );
  }
}

// TODO: Implement POST handler for creating products
// TODO: Implement PUT/PATCH handler for updating products
// TODO: Implement DELETE handler for deleting products
