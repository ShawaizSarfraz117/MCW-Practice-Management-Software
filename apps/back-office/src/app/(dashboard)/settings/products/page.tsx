"use client";

import { useState, useEffect } from "react";
import { Button, toast } from "@mcw/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product, fetchProducts, updateSingleProduct } from "./api";
import { AddProductForm } from "./components/AddProductForm";
import { ProductsList } from "./components/ProductsList";

export default function ProductsPage() {
  const queryClient = useQueryClient();

  // --- Tanstack Query Hooks ---
  const {
    data: products = [], // Default to empty array
    isLoading,
    isError,
    error: queryError,
  } = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // State to hold the editable list of products
  const [editableProducts, setEditableProducts] = useState<Product[]>([]);
  const [hasChanges, setHasChanges] = useState(false); // Track if changes exist

  // Effect to initialize/update editableProducts when products data changes
  useEffect(() => {
    // When fetched data changes, reset editableProducts and hasChanges flag
    setEditableProducts(products);
    setHasChanges(false);
  }, [products]);

  // Mutation hook for updating a single product
  const updateMutation = useMutation({
    mutationFn: updateSingleProduct,
    onSuccess: (updatedProduct) => {
      toast({
        title: "Success",
        description: `Product "${updatedProduct.name}" updated.`,
      });
      console.log("Product updated successfully:", updatedProduct);
    },
    onError: (error, productBeingUpdated) => {
      toast({
        title: "Error",
        description: `Failed to update "${productBeingUpdated.name}": ${error.message}`,
        variant: "destructive",
      });
      console.error(
        `Error updating product ID ${productBeingUpdated.id}:`,
        error,
      );
    },
  });

  // Handler to update the editableProducts state
  const handleProductChange = (
    productId: string,
    field: "name" | "price",
    value: string | number, // Input value can be string or number
  ) => {
    setEditableProducts((currentProducts) => {
      const updatedProducts = currentProducts.map((p) => {
        if (p.id === productId) {
          // We're looking up originalProduct but not using it directly,
          // add underscore prefix to indicate intentional non-usage
          const _originalProduct = products.find((op) => op.id === productId);
          // If it's the price field, parse it as a float, ensure it's not NaN
          const newValue =
            field === "price"
              ? parseFloat(String(value)) // Parse string/number input
              : value; // Use name directly
          // Return updated product, ensuring price is a valid number or 0
          const processedNewValue =
            field === "price"
              ? isNaN(newValue as number)
                ? p.price
                : newValue
              : newValue;

          return {
            ...p,
            [field]: processedNewValue,
          };
        }
        return p;
      });

      // After mapping, check if *any* product differs from the original ones
      const overallChanges = updatedProducts.some(
        (ep, index) =>
          ep.name !== products[index]?.name ||
          ep.price !== products[index]?.price,
      );
      setHasChanges(overallChanges); // Set the global flag

      return updatedProducts;
    });
  };

  // Handler for the Save Changes button
  const handleSaveChanges = async () => {
    // Make async to await potentially
    // Find products that have actually changed
    const changedProducts = editableProducts.filter((ep) => {
      const originalProduct = products.find((op) => op.id === ep.id);
      // If no original, or name/price differs, include it
      return (
        !originalProduct ||
        originalProduct.name !== ep.name ||
        originalProduct.price !== ep.price
      );
    });

    if (changedProducts.length > 0) {
      console.log("Saving changed products individually:", changedProducts);

      // Trigger mutation for each changed product
      changedProducts.forEach((product) => {
        console.log(`Mutating product: ${product.id} - ${product.name}`);
        updateMutation.mutate(product);
      });

      // After attempting all mutations, invalidate the query to refetch the list
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } else {
      console.log("No changes detected to save.");
      toast({ title: "Info", description: "No changes to save." });
    }
  };

  // --- Render Logic ---

  if (isLoading) {
    return <div>Loading products...</div>;
  }

  if (isError) {
    return (
      <div className="text-destructive">
        Error loading products: {queryError?.message || "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Products</h1>
          <p className="text-gray-600 text-base mt-1">
            Manage products and set rates.
          </p>
        </div>
        {/* Save Changes Button */}
        <Button
          onClick={handleSaveChanges}
          disabled={!hasChanges || updateMutation.isPending}
          className="bg-[#2D8467] hover:bg-[#256D53] text-white font-normal text-base"
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Add New Product Form */}
      <AddProductForm />

      {/* Products List */}
      <div className="space-y-4">
        <h2 className="text-base font-normal text-gray-700">
          Current Products
        </h2>
        <ProductsList
          editableProducts={editableProducts}
          onProductChange={handleProductChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
