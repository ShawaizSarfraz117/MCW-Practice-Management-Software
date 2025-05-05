import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/api/products/route";
import prismaMock from "@mcw/database/mock"; // Using mock setup from location example
import { Decimal } from "@prisma/client/runtime/library"; // Import Decimal type

// Define a type for our local mock product data
interface LocalMockProduct {
  id: string;
  name: string;
  price: Decimal; // Use Prisma Decimal type
  createdAt: Date; // Use Date type for consistency with Prisma
  updatedAt: Date;
}

describe("API Route: /api/products (Unit)", () => {
  beforeEach(() => {
    vi.resetAllMocks(); // Revert back to resetAllMocks
  });

  // Helper to create mock product data locally
  let productSequence = 0;
  const createMockProduct = (
    overrides?: Partial<LocalMockProduct>,
  ): LocalMockProduct => {
    productSequence += 1;
    return {
      id: `mock-product-${productSequence}`,
      name: `Mock Product ${productSequence}`,
      price: new Decimal("100.00"), // Create Decimal instance
      createdAt: new Date(), // Use Date object
      updatedAt: new Date(), // Use Date object
      ...overrides,
    };
  };

  it("should return products successfully when found", async () => {
    // Arrange
    const product1 = createMockProduct({
      name: "Unit Test Product A",
      price: new Decimal("55.00"),
    });
    const product2 = createMockProduct({
      name: "Unit Test Product B",
      price: new Decimal("66.00"),
    });
    const mockProducts = [product1, product2];
    prismaMock.product.findMany.mockResolvedValueOnce(mockProducts);

    // Act
    const response = await GET();

    // Assert
    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      orderBy: {
        name: "asc",
      },
    });
    expect(response.status).toBe(200);
    const responseData = await response.json();

    // Prepare expected data by serializing Date and Decimal fields to strings
    const expectedSerializedProducts = mockProducts.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      price: p.price.toString(), // Use toString() for Decimal
    }));

    expect(responseData).toEqual(expectedSerializedProducts);
  });

  it("should return an empty array when no products exist", async () => {
    // Arrange
    const expectedProducts: LocalMockProduct[] = [];
    prismaMock.product.findMany.mockResolvedValueOnce(expectedProducts);

    // Act
    const response = await GET();

    // Assert
    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      orderBy: {
        name: "asc",
      },
    });
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData).toEqual(expectedProducts);
  });

  it("should return 500 and log error when database query fails", async () => {
    // Arrange
    const dbError = new Error("Database connection failed");
    prismaMock.product.findMany.mockRejectedValueOnce(dbError);

    // Act
    const response = await GET();

    // Assert
    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(500);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Failed to fetch products." });
  });
});
