"use client";

import React, { useState } from "react";
import { Button, Input } from "@mcw/ui";
import { Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Product = {
  id: string;
  name: string;
  price: number;
};

const ProductSection = () => {
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("0");
  const [editedProducts, setEditedProducts] = useState<
    Record<string, { name: string; price: string }>
  >({});

  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/product");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async ({ name, price }: { name: string; price: number }) => {
      const res = await fetch("/api/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price }),
      });
      if (!res.ok) throw new Error("Failed to create product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setNewProductName("");
      setNewProductPrice("0");
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      price,
    }: {
      id: string;
      name: string;
      price: number;
    }) => {
      const res = await fetch("/api/product", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, price }),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditedProducts({});
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/product?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleSave = () => {
    if (newProductName && !isNaN(Number(newProductPrice))) {
      createProductMutation.mutate({
        name: newProductName,
        price: parseFloat(newProductPrice),
      });
    }

    Object.entries(editedProducts).forEach(([id, product]) => {
      if (!product.name || isNaN(Number(product.price))) return;
      updateProductMutation.mutate({
        id,
        name: product.name,
        price: parseFloat(product.price),
      });
    });
  };

  const handleChange = (id: string, field: "name" | "price", value: string) => {
    const existingProduct = products.find((p) => p.id === id);
    if (!existingProduct) return;

    setEditedProducts((prev) => {
      const previous = prev[id] || {
        name: existingProduct.name,
        price: existingProduct.price.toString(),
      };

      return {
        ...prev,
        [id]: {
          ...previous,
          [field]: value,
        },
      };
    });
  };

  const handleDelete = (id: string) => {
    deleteProductMutation.mutate(id);
  };

  return (
    <div>
      <div className="flex justify-between mt-5">
        <div>
          <h2 className="text-[22px] font-medium">Products</h2>
          <p className="text-[#4B5563] text-[14px]">
            Manage products and set rates.
          </p>
        </div>
        <Button
          className="bg-[#2d8467] hover:bg-[#236c53] w-[160px]"
          disabled={
            createProductMutation.isPending || updateProductMutation.isPending
          }
          onClick={handleSave}
        >
          {createProductMutation.isPending || updateProductMutation.isPending
            ? "Saving..."
            : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-4xl mt-5 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name
          </label>
          <Input
            className="w-full rounded-[6px] border h-[42px] mt-[12px]"
            placeholder="Product Name"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </label>
          <Input
            className="rounded-[6px] border w-[192px] h-[42px] mt-[12px] border-gray-300"
            min="0"
            placeholder="$0"
            type="number"
            value={newProductPrice}
            onChange={(e) => setNewProductPrice(e.target.value)}
          />
        </div>
      </div>

      <div className="max-w-4xl">
        {isLoading ? (
          <p>Loading products...</p>
        ) : products.length > 0 ? (
          <>
            <p className="block text-sm font-medium text-gray-700 mb-1">
              Added Products
            </p>
            {products.map((product) => {
              const edited = editedProducts[product.id] || {
                name: product.name,
                price: product.price.toString(),
              };
              return (
                <div
                  key={product.id}
                  className="grid grid-cols-2 gap-4 items-center mb-3"
                >
                  <Input
                    className="w-full rounded-[6px] border h-[42px] mt-[12px]"
                    value={edited.name}
                    onChange={(e) =>
                      handleChange(product.id, "name", e.target.value)
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      className="rounded-[6px] border w-[162px] h-[42px] mt-[12px] border-gray-300"
                      value={edited.price}
                      onChange={(e) =>
                        handleChange(product.id, "price", e.target.value)
                      }
                    />
                    <Trash2
                      className={`text-gray-500 cursor-pointer mt-[12px] hover:text-red-600 h-[16px] w-[14px] ${deleteProductMutation.status === "pending" ? "opacity-50 pointer-events-none" : ""}`}
                      onClick={() => handleDelete(product.id)}
                    />
                  </div>
                </div>
              );
            })}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ProductSection;
