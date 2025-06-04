"use client";

import React from "react";
import { Button, Input, toast } from "@mcw/ui";
import { Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";

type Product = {
  id: string;
  name: string;
  price: number;
};

const ProductRow = ({
  product,
  onUpdate,
  onDelete,
  isDeleting,
}: {
  product: Product;
  onUpdate: (id: string, name: string, price: number) => Promise<void>;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => {
  const form = useForm({
    defaultValues: {
      name: product.name,
      price: product.price.toString(),
    },
    onSubmit: async ({ value }) => {
      if (!value.name || isNaN(Number(value.price))) return;
      await onUpdate(product.id, value.name, parseFloat(value.price));
    },
  });

  return (
    <form
      className="grid grid-cols-2 gap-4 items-center mb-3"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => (
          <Input
            className="w-full rounded-[6px] border h-[42px] mt-[12px]"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={() => form.handleSubmit()}
          />
        )}
      </form.Field>
      <div className="flex items-center gap-2">
        <form.Field name="price">
          {(field) => (
            <Input
              className="rounded-[6px] border w-[162px] h-[42px] mt-[12px] border-gray-300"
              value={`$${field.state.value}`}
              onChange={(e) => {
                const cleanedValue = e.target.value.replace(/[^0-9.]/g, "");
                field.handleChange(cleanedValue);
              }}
              onBlur={() => form.handleSubmit()}
            />
          )}
        </form.Field>
        <Trash2
          className={`text-gray-500 cursor-pointer mt-[12px] hover:text-red-600 h-[16px] w-[14px] ${
            isDeleting ? "opacity-50 pointer-events-none" : ""
          }`}
          onClick={() => onDelete(product.id)}
        />
      </div>
      <button className="hidden" type="submit" />
    </form>
  );
};

const ProductSection = () => {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/product");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const newProductForm = useForm({
    defaultValues: {
      name: "",
      price: "0",
    },
    onSubmit: async ({ value }) => {
      if (!value.name || isNaN(Number(value.price))) return;

      await createProductMutation.mutateAsync({
        name: value.name,
        price: parseFloat(value.price),
      });
      newProductForm.reset();
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
      toast({
        title: "Product created",
        description: "The product has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create product: " + error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Product updated",
        description: "The product has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update product: " + error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Product Deleted",
        description: "The product has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveAll = async () => {
    await newProductForm.handleSubmit();
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
          onClick={handleSaveAll}
        >
          {createProductMutation.isPending || updateProductMutation.isPending
            ? "Saving..."
            : "Save Changes"}
        </Button>
      </div>
      <form
        className="grid grid-cols-2 gap-4 max-w-4xl mt-5 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          newProductForm.handleSubmit();
        }}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name
          </label>
          <newProductForm.Field
            children={(field) => (
              <Input
                className="w-full rounded-[6px] border h-[42px] mt-[12px]"
                placeholder="Product Name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
            name="name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </label>
          <newProductForm.Field
            children={(field) => (
              <Input
                className="rounded-[6px] border w-[192px] h-[42px] mt-[12px] border-gray-300"
                placeholder="$0.00"
                value={`$${field.state.value}`}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                  field.handleChange(cleaned);
                }}
              />
            )}
            name="price"
          />
        </div>
        <button className="hidden" type="submit" />
      </form>

      <div className="max-w-4xl">
        {isLoading ? (
          <p>Loading products...</p>
        ) : products.length > 0 ? (
          <>
            <p className="block text-sm font-medium text-gray-700 mb-1">
              Added Products
            </p>
            {products.map((product) => (
              <ProductRow
                key={product.id}
                isDeleting={deleteProductMutation.isPending}
                product={product}
                onDelete={(id) => deleteProductMutation.mutate(id)}
                onUpdate={async (id, name, price) => {
                  await updateProductMutation.mutateAsync({ id, name, price });
                }}
              />
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ProductSection;
