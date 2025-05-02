import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { z } from "zod";
import { getBackOfficeSession } from "@/utils/helpers";

const productsPayload = z.object({
  id: z.string(),
  name: z.string().max(100),
  price: z.string().min(0),
});
const idOnlySchema = productsPayload.pick({ id: true });

export async function GET() {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("session ", session.user.id);
    const productListData = await prisma.product.findMany({
      where: {
        user_id: session.user.id,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (!productListData) {
      return NextResponse.json(
        { error: "No Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(productListData);
  } catch (error) {
    console.error("Error fetching products list:", error);
    return NextResponse.json(
      { error: "Failed to fetch products list information" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    // Validate request body
    console.log("data 123", data);
    const validationResult = productsPayload.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: validationResult.error.message,
        },
        { status: 422 },
      );
    }
    console.log("*** ", validationResult.data);
    // Check if clinical info exists
    let existingClinicalInfo = null;

    if (validationResult.data.id) {
      existingClinicalInfo = await prisma.product.findFirst({
        where: { id: validationResult.data.id },
      });
    }

    if (existingClinicalInfo) {
      // Update existing clinical info
      console.log("IF ", validationResult.data);
      const updatedClinicalInfo = await prisma.product.update({
        where: { id: validationResult.data.id },
        data: {
          user_id: session.user.id,
          name: validationResult.data.name ?? undefined,
          price: validationResult.data.price ?? undefined,
        },
      });

      return NextResponse.json(updatedClinicalInfo);
    } else {
      // Insert new clinical info
      console.log("ELSE ", validationResult.data);
      const newClinicalInfo = await prisma.product.create({
        data: {
          user_id: session.user.id,
          name: validationResult.data.name ?? "",
          price: validationResult.data.price ?? "",
        },
      });

      return NextResponse.json(newClinicalInfo);
    }
  } catch (error) {
    console.error("Error updating product information:", error);
    return NextResponse.json(
      { error: "Failed to update product information" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    // Validate request body

    const validationResult = idOnlySchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: validationResult.error.message,
        },
        { status: 422 },
      );
    }
    console.log("data 123", validationResult.data);
    const { id } = validationResult.data;

    const deletedProduct = await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json(deletedProduct);
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
