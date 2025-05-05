"use client";

import { useState } from "react";
import { Button, Input, Label, toast } from "@mcw/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addProduct } from "../api";

export function AddProductForm() {
  const queryClient = useQueryClient();
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");

  const addMutation = useMutation({
    mutationFn: addProduct,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setNewProductName("");
      setNewProductPrice("");
      toast({ title: "Success", description: `Product "${data.name}" added.` });
      console.log("Product added successfully:", data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add product: ${error.message}`,
        variant: "destructive",
      });
      console.error("Error adding product:", error);
    },
  });

  const handleAddProduct = () => {
    const name = newProductName.trim();
    const price = parseFloat(newProductPrice); // Parse price string to number

    // Basic client-side validation
    if (!name) {
      toast({
        title: "Validation Error",
        description: "Product name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    if (isNaN(price) || price < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid, non-negative price.",
        variant: "destructive",
      });
      return;
    }

    addMutation.mutate({ name, price });
  };

  return (
    <div className="border rounded-md p-4 space-y-4">
      <h2 className="text-lg font-medium">Add New Product</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <Label htmlFor="productName">Product Name</Label>
          <Input
            id="productName"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            placeholder="Enter product name"
            className="mt-1"
            disabled={addMutation.isPending}
          />
        </div>
        <div>
          <Label htmlFor="productPrice">Price</Label>
          <Input
            id="productPrice"
            type="number"
            value={newProductPrice}
            onChange={(e) => setNewProductPrice(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="mt-1"
            prefix="$"
            disabled={addMutation.isPending}
          />
        </div>
        {/* Add Button for the form */}
        <div className="md:col-start-3">
          <Button
            onClick={handleAddProduct}
            disabled={
              addMutation.isPending || !newProductName || !newProductPrice
            }
            className="w-full md:w-auto" // Full width on small screens
          >
            {addMutation.isPending ? "Adding..." : "Add Product"}
          </Button>
        </div>
      </div>
    </div>
  );
}
