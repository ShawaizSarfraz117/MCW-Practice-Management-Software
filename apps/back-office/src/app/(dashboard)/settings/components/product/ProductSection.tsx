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
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("0");
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/product");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async ({ name, price }: { name: string; price: number }) => {
      const response = await fetch("/api/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price }),
      });
      if (!response.ok) throw new Error("Failed to create product");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductName("");
      setProductPrice("0");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/product?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete product");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleSave = () => {
    if (!productName || isNaN(Number(productPrice))) return;
    createProductMutation.mutate({
      name: productName,
      price: parseFloat(productPrice),
    });
  };

  const handleDelete = (id: string) => {
    deleteProductMutation.mutate(id);
  };

  return (
    <div className="">
      {/* Header */}
      <div className="flex justify-between mt-5">
        <div>
          <h2 className="text-[22px] font-medium">Products</h2>
          <p className="text-[#4B5563] text-[14px]">
            Manage products and set rates.
          </p>
        </div>
        <Button
          onClick={handleSave}
          className="bg-[#2d8467] hover:bg-[#236c53] w-[160px]"
          disabled={createProductMutation.status === "pending"}
        >
          {createProductMutation.status === "pending"
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
            placeholder="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full rounded-[6px] border h-[42px] mt-[12px]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </label>
          <Input
            type="number"
            min="0"
            placeholder="$0"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            className="rounded-[6px] border w-[192px] h-[42px] mt-[12px] border-gray-300"
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
            {products.map((product) => (
              <div
                key={product.id}
                className="grid grid-cols-2 gap-4 items-center mb-3"
              >
                <Input
                  value={product.name}
                  readOnly
                  className="w-full rounded-[6px] border h-[42px] mt-[12px]"
                />
                <div className="flex items-center gap-2">
                  <Input
                    value={`$${product.price}`}
                    readOnly
                    className="rounded-[6px] border w-[162px] h-[42px] mt-[12px] border-gray-300"
                  />
                  <Trash2
                    className={`text-gray-500 cursor-pointer mt-[12px] hover:text-red-600 h-[16px] w-[14px] ${deleteProductMutation.status === "pending" ? "opacity-50 pointer-events-none" : ""}`}
                    onClick={() => handleDelete(product.id)}
                  />
                </div>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ProductSection;
