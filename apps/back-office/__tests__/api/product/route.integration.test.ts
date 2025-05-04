import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@mcw/database";
import { NextRequest } from "next/server";
import { DELETE, GET, POST, PUT } from "@/api/product/route";

vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(() =>
    Promise.resolve({
      user: {
        id: "test-user-id",
      },
    }),
  ),
}));

const ProductFactory = {
  build: (overrides = {}) => ({
    name: "Test Product",
    price: 99.99,
    ...overrides,
  }),
};

const ProductPrismaFactory = {
  create: async (overrides = {}) => {
    return prisma.product.create({
      data: ProductFactory.build(overrides),
    });
  },
};

function createMockRequest(
  url: string,
  method: string = "GET",
  body?: Record<string, unknown>,
): NextRequest {
  const request = new Request(`http://localhost${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return request as NextRequest;
}

describe("Product API Integration Tests", () => {
  afterAll(async () => {
    await prisma.product.deleteMany();
  });

  beforeEach(async () => {
    await prisma.product.deleteMany();
    vi.clearAllMocks();
  });

  it("GET /api/product should return products", async () => {
    const product = await ProductPrismaFactory.create();
    const response = await GET();

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual([
      expect.objectContaining({
        id: product.id,
        name: product.name,
        price: product.price.toString(),
      }),
    ]);
  });

  it("POST /api/product should create product", async () => {
    const payload = ProductFactory.build();
    const request = createMockRequest("/api/product", "POST", payload);
    const response = await POST(request);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toMatchObject({
      name: payload.name,
      price: payload.price.toString(),
    });
  });

  it("POST /api/product should return 400 for invalid payload", async () => {
    const request = createMockRequest("/api/product", "POST", { not: "valid" });
    const response = await POST(request);
    expect(response.status).toBe(422);
  });

  it("PUT /api/product should update a product", async () => {
    const product = await ProductPrismaFactory.create();
    const updateData = {
      id: product.id,
      name: "Updated Product",
      price: 123.45,
    };
    const request = createMockRequest("/api/product", "PUT", updateData);
    const response = await PUT(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      id: product.id,
      name: updateData.name,
      price: updateData.price.toString(),
    });
  });

  it("DELETE /api/product/?id=<id> should delete a product", async () => {
    const product = await ProductPrismaFactory.create();
    const request = createMockRequest(
      `/api/product?id=${product.id}`,
      "DELETE",
    );
    const response = await DELETE(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("success", true);

    const deletedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(deletedProduct).toBeNull();
  });
});
