import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (id) {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(product);
    }

    logger.info("Retrieving all products");
    const products = await prisma.product.findMany();
    return NextResponse.json(products);
  } catch (error) {
    logger.error({ error }, "Error fetching products");
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.name || data.price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    const newProduct = await prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
      },
    });
    logger.info({ id: newProduct.id }, "Product created");
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Error creating product");
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}

// DELETE - Remove a product by id
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const deletedProduct = await prisma.product.delete({ where: { id } });
    logger.info({ id }, "Product deleted");
    return NextResponse.json({
      message: "Product deleted",
      product: deletedProduct,
    });
  } catch (error) {
    logger.error({ error }, "Error deleting product");
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}

// PUT - Update a product
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryId = searchParams.get("id");
    const data = await request.json();
    const { id: bodyId, ...updateData } = data;

    const id = queryId || bodyId;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Convert price to Decimal if it's provided
    const filteredUpdateData: { name?: string; price?: Decimal } = {};
    if (updateData.name !== undefined)
      filteredUpdateData.name = updateData.name;
    if (updateData.price !== undefined) {
      const priceValue =
        typeof updateData.price === "string"
          ? parseFloat(updateData.price)
          : updateData.price;
      filteredUpdateData.price = new Decimal(priceValue);
    }

    // If no fields to update, return the existing product
    if (Object.keys(filteredUpdateData).length === 0) {
      return NextResponse.json(existingProduct);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: filteredUpdateData,
    });

    logger.info({ id }, "Product updated");
    return NextResponse.json(updatedProduct);
  } catch (error) {
    logger.error({ error }, "Error updating product");
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}
