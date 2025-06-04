import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { ProductFactory, ProductPrismaFactory } from "@mcw/database/mock-data";
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
    const request = createRequestWithBody("/api/product", {
      ...payload,
      price: Number(payload.price),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toMatchObject({
      name: payload.name,
      price: payload.price.toString(),
    });
  });

  it("POST /api/product should return 400 for invalid payload", async () => {
    const request = createRequestWithBody("/api/product", { not: "valid" });
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
    const request = createRequestWithBody("/api/product", updateData, {
      method: "PUT",
    });
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
    const request = createRequest(`/api/product?id=${product.id}`, {
      method: "DELETE",
    });
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
