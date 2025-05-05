import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/api/products/route";
import prismaMock from "@mcw/database/mock"; // Using mock setup from location example
import { Decimal } from "@prisma/client/runtime/library"; // Import Decimal type
import { POST } from "@/api/products/route"; // Add POST
import { NextRequest } from "next/server"; // Import NextRequest

// Define a type for our local mock product data
interface LocalMockProduct {
  id: string;
  name: string;
  price: Decimal; // Use Prisma Decimal type
  createdAt: Date; // Use Date type for consistency with Prisma
  updatedAt: Date;
}

// Define a type for the product creation body to avoid using 'any'
interface ProductCreateBody {
  name?: string;
  price?: number;
  [key: string]: unknown; // Allow additional properties for testing validation
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

// Helper to simulate POST request
async function simulatePostRequest(body: ProductCreateBody) {
  const request = new NextRequest("http://localhost/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(request);
}

describe("POST /api/products (Unit)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Using the same helper from GET tests
  let productSequence = 100; // Start sequence higher to avoid collision if needed
  const createMockProduct = (
    overrides?: Partial<LocalMockProduct>,
  ): LocalMockProduct => {
    productSequence += 1;
    return {
      id: `mock-product-${productSequence}`,
      name: `Mock Product ${productSequence}`,
      price: new Decimal("100.00"),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  };

  it("should create a product and return 201 on valid input", async () => {
    // Arrange
    const inputData = { name: "New Valid Product", price: 199.99 };
    const expectedCreatedProduct = createMockProduct({
      name: inputData.name,
      price: new Decimal(inputData.price),
    });
    prismaMock.product.create.mockResolvedValueOnce(expectedCreatedProduct);

    // Act
    const response = await simulatePostRequest(inputData);

    // Assert
    expect(prismaMock.product.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.product.create).toHaveBeenCalledWith({
      data: {
        name: inputData.name,
        price: inputData.price, // The route handler converts price to number
      },
    });
    expect(response.status).toBe(201);
    const responseData = await response.json();

    // Prepare expected data by serializing Date and Decimal
    const expectedSerialized = {
      ...expectedCreatedProduct,
      createdAt: expectedCreatedProduct.createdAt.toISOString(),
      updatedAt: expectedCreatedProduct.updatedAt.toISOString(),
      price: expectedCreatedProduct.price.toString(),
    };
    expect(responseData).toEqual(expectedSerialized);
  });

  it("should return 400 if name is missing", async () => {
    // Arrange
    const inputData = { price: 50 }; // Name is missing

    // Act
    const response = await simulatePostRequest(inputData);

    // Assert
    expect(prismaMock.product.create).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData.error).toContain("Invalid input");
    expect(responseData.details?.name).toBeDefined();
  });

  it("should return 400 if price is missing or invalid", async () => {
    // Arrange
    const inputData = { name: "Product Without Price" }; // Price is missing

    // Act
    const response = await simulatePostRequest(inputData);

    // Assert
    expect(prismaMock.product.create).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData.error).toContain("Invalid input");
    expect(responseData.details?.price).toBeDefined();
  });

  it("should return 400 if price is negative", async () => {
    // Arrange
    const inputData = { name: "Negative Price Product", price: -10 };

    // Act
    const response = await simulatePostRequest(inputData);

    // Assert
    expect(prismaMock.product.create).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData.error).toContain("Invalid input");
    expect(responseData.details?.price).toBeDefined(); // Zod should catch negative price
  });

  it("should return 500 and log error if database creation fails", async () => {
    // Arrange
    const inputData = { name: "DB Fail Product", price: 75 };
    const dbError = new Error("Database constraint violation");
    prismaMock.product.create.mockRejectedValueOnce(dbError);

    // Act
    const response = await simulatePostRequest(inputData);

    // Assert
    expect(prismaMock.product.create).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(500);
    const responseData = await response.json();
    expect(responseData).toEqual({ error: "Failed to create product." });
  });
});
