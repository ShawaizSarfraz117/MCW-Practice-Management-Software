import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@mcw/database";
import { ProductFactory } from "@mcw/database/mock-data";
import { GET } from "@/api/products/route";
import { NextRequest } from "next/server";

// Helper to simulate API request (if no central test helper exists)
async function simulateRequest(_request?: NextRequest) {
  // If your GET handler uses the request object, pass it here.
  // Otherwise, calling GET() directly might suffice if it doesn't use `request`.
  // For simplicity, assuming GET() doesn't rely heavily on request object for now.
  return GET();
}

describe("API Route: /api/products (Integration)", () => {
  // Clean up database before and after tests
  beforeEach(async () => {
    await prisma.product.deleteMany({});
  });

  afterEach(async () => {
    await prisma.product.deleteMany({});
  });

  it("should return an empty array when no products exist", async () => {
    const response = await simulateRequest();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("should return all products from the database", async () => {
    // Arrange: Create some products using the factory and prisma
    const productData1 = ProductFactory({
      name: "Test Product A",
      price: "10.50", // Mock factory likely expects string, adjust if needed
    });
    await prisma.product.create({ data: productData1 });

    const productData2 = ProductFactory({
      name: "Test Product B",
      price: "20.00", // Mock factory likely expects string, adjust if needed
    });
    await prisma.product.create({ data: productData2 });

    // Act: Call the API route handler
    const response = await simulateRequest();
    const data = await response.json();

    // Assert: Check the response
    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    // Basic check, assuming default order is by name ascending
    expect(data[0].name).toBe("Test Product A");
    expect(data[1].name).toBe("Test Product B");
    // Check price formatting (Prisma Decimal might be stringified)
    expect(data[0].price).toBe("10.50");
    expect(data[1].price).toBe("20.00");
  });

  // Add more tests for specific scenarios if needed (e.g., pagination, filtering if implemented)
});
