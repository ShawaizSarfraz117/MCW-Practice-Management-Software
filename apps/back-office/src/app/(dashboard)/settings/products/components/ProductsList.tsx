"use client";

import { Button, Input } from "@mcw/ui";
import { Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";
import { Product, deleteProduct } from "../api";

interface ProductsListProps {
  editableProducts: Product[];
  onProductChange: (
    productId: string,
    field: "name" | "price",
    value: string | number,
  ) => void;
  isLoading: boolean;
}

export function ProductsList({
  editableProducts,
  onProductChange,
  isLoading,
}: ProductsListProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: (data, productId) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Success", description: data.message });
      console.log("Product deleted successfully, ID:", productId);
    },
    onError: (error, productId) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
      console.error("Error deleting product, ID:", productId, error);
    },
  });

  const handleDelete = (productId: string) => {
    console.log("Requesting delete for product ID:", productId);
    deleteMutation.mutate(productId);
  };

  if (editableProducts.length === 0 && !isLoading) {
    return (
      <p className="text-muted-foreground text-sm">
        No products found. Add one using the form above.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {editableProducts.map((product) => (
        <div
          key={product.id}
          className="flex items-center gap-4 p-3 border rounded-md bg-card"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow items-center">
            <div className="md:col-span-2">
              <Input
                id={`productName-${product.id}`}
                value={product.name}
                onChange={(e) =>
                  onProductChange(product.id, "name", e.target.value)
                }
                placeholder="Product name"
                className="mt-1"
              />
            </div>
            <div>
              <Input
                id={`productPrice-${product.id}`}
                type="number"
                value={product.price}
                onChange={(e) =>
                  onProductChange(product.id, "price", e.target.value)
                }
                placeholder="0.00"
                min="0"
                step="0.01"
                className="mt-1"
                prefix="$"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(product.id)}
            disabled={
              deleteMutation.isPending &&
              deleteMutation.variables === product.id
            }
            aria-label={`Delete ${product.name}`}
          >
            {deleteMutation.isPending &&
            deleteMutation.variables === product.id ? (
              <span className="animate-spin h-4 w-4 border-b-2 border-current rounded-full"></span>
            ) : (
              <Trash2 className="h-4 w-4 text-destructive" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}
