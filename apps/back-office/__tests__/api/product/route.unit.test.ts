import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, DELETE, PUT } from "@/api/product/route";
import prismaMock from "@mcw/database/mock";
import { ProductFactory } from "@mcw/database/mock-data";

vi.mock("@/utils/helpers", () => ({
  getBackOfficeSession: vi.fn(() =>
    Promise.resolve({
      user: {
        id: "test-user-id",
      },
    }),
  ),
}));

describe("Product API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /api/product should return all products", async () => {
    const product1 = ProductFactory.build();
    const product2 = ProductFactory.build();
    const products = [product1, product2];

    prismaMock.product.findMany.mockResolvedValueOnce(products);

    const response = await GET();

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(products.length);
    expect(json[0]).toMatchObject({
      id: product1.id,
      name: product1.name,
      price: product1.price.toString(),
    });
    expect(json[1]).toMatchObject({
      id: product2.id,
      name: product2.name,
      price: product2.price.toString(),
    });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      orderBy: {
        name: "asc",
      },
    });
  });

  it("POST /api/product should create a new product", async () => {
    const productData = ProductFactory.build();
    const { id, ...createData } = productData;
    const newProduct = ProductFactory.build(productData);

    prismaMock.product.create.mockResolvedValueOnce(newProduct);

    const req = createRequestWithBody("/api/product", {
      ...createData,
      price: Number(productData.price),
    });
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();

    expect(json).toMatchObject({
      name: productData.name,
      price: productData.price.toString(),
    });

    expect(prismaMock.product.create).toHaveBeenCalledWith({
      data: { ...createData, price: Number(productData.price) },
    });
  });

  it("POST /api/product should return 422 for invalid payload", async () => {
    const invalidData = { name: "", price: -10 };

    const req = createRequestWithBody("/api/product", invalidData);
    const response = await POST(req);

    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Invalid request payload");
    expect(json).toHaveProperty("details");
  });

  it("PUT /api/product should update an existing product", async () => {
    const existingProduct = ProductFactory.build();
    const updateData = ProductFactory.build();
    const { id, ...updateDataWithoutId } = updateData;
    const updatedProduct = ProductFactory.build({
      ...existingProduct,
      ...updateData,
    });

    prismaMock.product.findUnique.mockResolvedValueOnce(existingProduct);
    prismaMock.product.update.mockResolvedValueOnce(updatedProduct);

    const req = createRequestWithBody(
      "/api/product",
      {
        ...updateData,
        id: existingProduct.id,
        price: Number(updateData.price),
      },
      {
        method: "PUT",
      },
    );
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toMatchObject({
      name: updateData.name,
      price: updateData.price.toString(),
    });

    expect(prismaMock.product.update).toHaveBeenCalledWith({
      where: { id: existingProduct.id },
      data: { ...updateDataWithoutId, price: Number(updateData.price) },
    });
  });

  it("PUT /api/product should return 404 for non-existent product", async () => {
    const updateData = ProductFactory.build();

    prismaMock.product.findUnique.mockResolvedValueOnce(null);

    const req = createRequestWithBody(
      "/api/product",
      {
        ...updateData,
        id: "non-existent-id",
        price: Number(updateData.price),
      },
      {
        method: "PUT",
      },
    );
    const response = await PUT(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Product not found");

    expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
      where: { id: "non-existent-id" },
    });

    expect(prismaMock.product.update).not.toHaveBeenCalled();
  });

  it("DELETE /api/product/?id=<id> should return 404 for non-existent product", async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(null);

    const req = createRequest("/api/product/?id=non-existent-id", {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Product not found");

    expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
      where: { id: "non-existent-id" },
    });

    expect(prismaMock.product.delete).not.toHaveBeenCalled();
  });

  it("DELETE /api/product/?id=<id> should delete a product", async () => {
    const product = ProductFactory.build();

    prismaMock.product.findUnique.mockResolvedValueOnce(product);
    prismaMock.product.delete.mockResolvedValueOnce(product);

    const req = createRequest(`/api/product/?id=${product.id}`, {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveProperty("success", true);
    expect(prismaMock.product.delete).toHaveBeenCalledWith({
      where: { id: product.id },
    });
  });

  it("DELETE /api/product should return 400 when no ID is provided", async () => {
    const req = createRequest("/api/product", {
      method: "DELETE",
    });
    const response = await DELETE(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Product ID is required");
  });
});
