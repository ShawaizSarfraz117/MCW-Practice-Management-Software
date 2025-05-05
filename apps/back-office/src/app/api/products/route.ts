import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { z } from "zod";

// Define the schema for product creation using Zod
const createProductSchema = z.object({
  name: z.string().min(1, { message: "Product name cannot be empty" }),
  // Ensure price is a number, converting string input if necessary, and non-negative
  price: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number({ invalid_type_error: "Price must be a number" }).nonnegative({
      message: "Price must be zero or positive",
    }),
  ),
});

// Define the schema for product update (similar to create, but ID comes from query)
const updateProductSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "Product name cannot be empty" })
      .optional(), // Optional: allow updating only price or name
    price: z
      .preprocess(
        (val) => (typeof val === "string" ? parseFloat(val) : val),
        z.number({ invalid_type_error: "Price must be a number" }).nonnegative({
          message: "Price must be zero or positive",
        }),
      )
      .optional(), // Optional: allow updating only name or price
  })
  .refine((data) => data.name !== undefined || data.price !== undefined, {
    // Ensure at least one field is provided
    message: "At least name or price must be provided for update",
  });

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

/**
 * POST /api/products
 * Creates a new product.
 */
export async function POST(request: NextRequest) {
  try {
    logger.info("Attempting to create a new product");
    const body = await request.json();

    // Validate request body against the schema
    const validation = createProductSchema.safeParse(body);
    if (!validation.success) {
      logger.error(
        { errors: validation.error.format() },
        "Product creation validation failed",
      );
      return NextResponse.json(
        {
          error: "Invalid input.",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, price } = validation.data;

    // Create the product in the database
    const newProduct = await prisma.product.create({
      data: {
        name,
        price,
        // Assuming 'is_active' defaults or is handled elsewhere; add if needed
      },
    });

    logger.info(
      { productId: newProduct.id },
      `Successfully created product: ${newProduct.name}`,
    );
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    // Log the error object first, then the message
    logger.error(error as Error, "Failed to create product");
    // Handle potential database errors or other issues
    return NextResponse.json(
      { error: "Failed to create product." },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/products?id={productId}
 * Updates a specific product by its ID.
 */
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      logger.warn("Product ID missing from PUT request");
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    logger.info({ productId: id }, `Attempting to update product`);
    const body = await request.json();

    // Validate request body
    const validation = updateProductSchema.safeParse(body);
    if (!validation.success) {
      logger.error(
        { errors: validation.error.format(), productId: id },
        "Product update validation failed",
      );
      return NextResponse.json(
        {
          error: "Invalid input.",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const dataToUpdate = validation.data;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      logger.warn({ productId: id }, "Product not found for update");
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Update the product in the database
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        // Only include fields that were actually provided in the request
        ...(dataToUpdate.name !== undefined && { name: dataToUpdate.name }),
        ...(dataToUpdate.price !== undefined && { price: dataToUpdate.price }),
      },
    });

    logger.info(
      { productId: updatedProduct.id },
      `Successfully updated product: ${updatedProduct.name}`,
    );
    return NextResponse.json(updatedProduct, { status: 200 }); // Return updated product
  } catch (error: unknown) {
    // Log the error object first
    if (error instanceof Error) {
      logger.error(error, "Failed during product update");
    } else {
      logger.error(
        { message: String(error) },
        "Failed during product update with unknown error type",
      );
    }

    // Check for specific Prisma errors if needed (like unique constraint violations if applicable)
    // Example: if (error instanceof Error && 'code' in error && error.code === 'P2002') { ... }

    // Generic server error
    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/products?id={productId}
 * Deletes a specific product by its ID.
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      logger.warn("Product ID missing from DELETE request");
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    logger.info({ productId: id }, `Attempting to delete product`);

    // Check if the product exists before attempting deletion
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      logger.warn({ productId: id }, "Product not found for deletion");
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Delete the product
    await prisma.product.delete({
      where: { id },
    });

    logger.info({ productId: id }, `Successfully deleted product`);
    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    // Log the error object first, then the message
    logger.error(error as Error, "Failed to delete product");
    // Handle potential database errors or other issues
    return NextResponse.json(
      { error: "Failed to delete product." },
      { status: 500 },
    );
  }
}

// TODO: Implement DELETE handler for deleting products
