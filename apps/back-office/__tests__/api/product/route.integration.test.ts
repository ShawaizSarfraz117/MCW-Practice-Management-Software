import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  afterAll,
  vi,
} from "vitest";
import { prisma } from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { DELETE, GET, POST, PUT } from "@/api/product/route";
import { ProductPrismaFactory } from "@mcw/database/mock-data";

describe("Product API Integration Tests", () => {
  afterAll(async () => {
    await prisma.product.deleteMany();
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/product should return products", async () => {
    const product = await ProductPrismaFactory.create();
    const req = createRequest("/api/product");
    const response = await GET(req);

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

  it("POST /api/product should create products", async () => {
    const payload = {
      name: "Test Product",
      price: "99.99",
    };

    const request = createRequestWithBody("/api/product", payload);
    const response = await POST(request);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toMatchObject({
      name: payload.name,
      price: payload.price,
    });
  });

  it("POST /api/product should return 400 for invalid payload", async () => {
    const request = createRequestWithBody("/api/product", { not: "valid" });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("PUT /api/product should update a product", async () => {
    const product = await ProductPrismaFactory.create();
    const updateData = {
      id: product.id,
      name: "Updated Product",
      price: "299.99",
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
      price: updateData.price,
    });
  });

  it("DELETE /api/product/?id=<id> should delete a product", async () => {
    const product = await ProductPrismaFactory.create();

    const request = createRequest(`/api/product/?id=${product.id}`, {
      method: "DELETE",
    });
    const response = await DELETE(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("message", "Product deleted");
    expect(json).toHaveProperty("product");
    expect(json.product).toHaveProperty("id", product.id);

    // Verify the product was actually deleted
    const deletedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(deletedProduct).toBeNull();
  });
});
