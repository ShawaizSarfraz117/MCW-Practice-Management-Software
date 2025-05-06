import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST, DELETE, PUT } from "@/api/product/route";
import prismaMock from "@mcw/database/mock";
import { ProductFactory } from "@mcw/database/mock-data";
import { Decimal } from "@prisma/client/runtime/library";

describe("Product API Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /api/product should return all products", async () => {
    const product1 = ProductFactory.build();
    const product2 = ProductFactory.build();
    const products = [product1, product2];

    prismaMock.product.findMany.mockResolvedValueOnce(products);

    const req = createRequest("/api/product");
    const response = await GET(req);

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

    expect(prismaMock.product.findMany).toHaveBeenCalled();
  });

  it("GET /api/product/?id=<id> should return 404 for non-existent product", async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(null);

    const req = createRequest("/api/product/?id=non-existent-id");
    const response = await GET(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Product not found");
  });

  it("POST /api/product should create a new product", async () => {
    const productData = ProductFactory.build();
    const newProduct = ProductFactory.build(productData);

    prismaMock.product.create.mockResolvedValueOnce(newProduct);

    const req = createRequestWithBody("/api/product", {
      name: productData.name,
      price: productData.price.toString(),
    });
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();

    expect(json).toMatchObject({
      name: productData.name,
      price: productData.price.toString(),
    });

    expect(prismaMock.product.create).toHaveBeenCalledWith({
      data: {
        name: productData.name,
        price: productData.price.toString(),
      },
    });
  });

  it("PUT /api/product should update an existing product", async () => {
    const existingProduct = ProductFactory.build();
    const updateData = {
      name: "Updated Product",
      price: "299.99",
    };

    const updatedProduct = {
      ...existingProduct,
      name: updateData.name,
      price: new Decimal(updateData.price),
    };

    prismaMock.product.findUnique.mockResolvedValueOnce(existingProduct);
    prismaMock.product.update.mockResolvedValueOnce(updatedProduct);

    const req = createRequestWithBody(
      "/api/product",
      {
        id: existingProduct.id,
        ...updateData,
      },
      {
        method: "PUT",
      },
    );
    const response = await PUT(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toMatchObject({
      id: existingProduct.id,
      name: updateData.name,
      price: updateData.price,
    });

    expect(prismaMock.product.update).toHaveBeenCalledWith({
      where: { id: existingProduct.id },
      data: {
        name: updateData.name,
        price: new Decimal(updateData.price),
      },
    });
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

    expect(json).toHaveProperty("message", "Product deleted");
    expect(json).toHaveProperty("product");
    expect(json.product).toMatchObject({
      id: product.id,
      name: product.name,
      price: product.price.toString(),
    });

    expect(prismaMock.product.delete).toHaveBeenCalledWith({
      where: { id: product.id },
    });
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
  });
});
