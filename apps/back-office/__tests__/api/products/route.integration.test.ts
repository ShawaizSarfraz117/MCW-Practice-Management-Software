import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@mcw/database";
import { ProductFactory } from "@mcw/database/mock-data";
import { GET, PUT } from "@/api/products/route";
import { NextRequest } from "next/server";

// Define a type for the product update body to avoid using 'any'
interface ProductUpdateBody {
  name?: string;
  price?: number;
  [key: string]: unknown; // Allow additional properties for flexibility in tests
}

// Helper to simulate API request (if no central test helper exists)
async function simulateRequest(_request?: NextRequest) {
  // If your GET handler uses the request object, pass it here.
  // Otherwise, calling GET() directly might suffice if it doesn't use `request`.
  // For simplicity, assuming GET() doesn't rely heavily on request object for now.
  return GET();
}

// Helper to simulate PUT request
async function simulatePutRequest(id: string | null, body: ProductUpdateBody) {
  const url = `/api/products${id ? `?id=${id}` : ""}`; // Construct URL with or without ID
  const request = new NextRequest(`http://localhost${url}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return PUT(request);
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

describe("PUT /api/products?id={productId} (Integration)", () => {
  let testProduct: { id: string; name: string; price: string | number }; // Store created product

  beforeEach(async () => {
    // Clean up any potential leftovers
    await prisma.product.deleteMany({});
    // Create a product to be updated
    const productData = ProductFactory({
      name: "Initial Product",
      price: "99.99",
    });
    const created = await prisma.product.create({ data: productData });
    // Prisma returns Decimal as object, convert price for consistency in tests if needed
    testProduct = { ...created, price: created.price.toString() };
  });

  afterEach(async () => {
    await prisma.product.deleteMany({});
  });

  it("should update both name and price successfully", async () => {
    const updateData = { name: "Updated Name", price: 123.45 };
    const response = await simulatePutRequest(testProduct.id, updateData);
    const updatedProduct = await response.json();

    expect(response.status).toBe(200);
    expect(updatedProduct.id).toBe(testProduct.id);
    expect(updatedProduct.name).toBe(updateData.name);
    expect(updatedProduct.price).toBe(String(updateData.price)); // Compare stringified Decimal

    // Verify in DB
    const dbProduct = await prisma.product.findUnique({
      where: { id: testProduct.id },
    });
    expect(dbProduct?.name).toBe(updateData.name);
    expect(dbProduct?.price.toString()).toBe(String(updateData.price));
  });

  it("should update only the name successfully", async () => {
    const updateData = { name: "Only Name Updated" };
    const response = await simulatePutRequest(testProduct.id, updateData);
    const updatedProduct = await response.json();

    expect(response.status).toBe(200);
    expect(updatedProduct.name).toBe(updateData.name);
    expect(updatedProduct.price).toBe(testProduct.price); // Price should remain unchanged

    // Verify in DB
    const dbProduct = await prisma.product.findUnique({
      where: { id: testProduct.id },
    });
    expect(dbProduct?.name).toBe(updateData.name);
    expect(dbProduct?.price.toString()).toBe(testProduct.price);
  });

  it("should update only the price successfully", async () => {
    const updateData = { price: 0.5 };
    const response = await simulatePutRequest(testProduct.id, updateData);
    const updatedProduct = await response.json();

    expect(response.status).toBe(200);
    expect(updatedProduct.name).toBe(testProduct.name); // Name should remain unchanged
    expect(updatedProduct.price).toBe(String(updateData.price));

    // Verify in DB
    const dbProduct = await prisma.product.findUnique({
      where: { id: testProduct.id },
    });
    expect(dbProduct?.name).toBe(testProduct.name);
    expect(dbProduct?.price.toString()).toBe(String(updateData.price));
  });

  it("should return 404 Not Found if product ID does not exist", async () => {
    const nonExistentId = "clnonexistent000000000000"; // Example non-existent cuid
    const updateData = { name: "Update Fail", price: 10 };
    const response = await simulatePutRequest(nonExistentId, updateData);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toContain("Product not found");
  });

  it("should return 400 Bad Request if product ID is missing", async () => {
    const updateData = { name: "Update Fail", price: 10 };
    const response = await simulatePutRequest(null, updateData); // Pass null for ID

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Product ID is required");
  });

  it("should return 400 Bad Request for invalid body (empty name)", async () => {
    const updateData = { name: "", price: 10 };
    const response = await simulatePutRequest(testProduct.id, updateData);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid input");
    expect(body.details?.name).toBeDefined(); // Check Zod error details
  });

  it("should return 400 Bad Request for invalid body (negative price)", async () => {
    const updateData = { price: -10 };
    const response = await simulatePutRequest(testProduct.id, updateData);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid input");
    expect(body.details?.price).toBeDefined(); // Check Zod error details
  });

  it("should return 400 Bad Request if neither name nor price is provided", async () => {
    const updateData = {}; // Empty object
    const response = await simulatePutRequest(testProduct.id, updateData);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid input");
    // Zod refine error might appear differently, check for message
    expect(JSON.stringify(body.details)).toContain(
      "At least name or price must be provided",
    );
  });
});
