"use client";

import { useState } from "react";
import { Button, Input, Label, toast } from "@mcw/ui";
import { Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Assuming the Prisma model looks like this, adjust if necessary
// Ideally, import from `@mcw/database` if types are generated/exported
interface Product {
  id: string;
  name: string;
  price: number;
  // Add other fields like is_active if they exist and are needed
}

// --- API Fetching Functions ---

const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch("/api/products");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

const addProduct = async (newProduct: {
  name: string;
  price: number;
}): Promise<Product> => {
  const response = await fetch("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newProduct),
  });
  if (!response.ok) {
    // Try to parse error details from the backend
    const errorData = await response.json().catch(() => ({})); // Catch if body isn't JSON
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`,
    );
  }
  return response.json();
};

const deleteProduct = async (
  productId: string,
): Promise<{ message: string }> => {
  const response = await fetch(`/api/products?id=${productId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`,
    );
  }
  return response.json(); // Contains { message: "..." } on success
};

// --- Component ---

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState(""); // Keep as string for input

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

  const addMutation = useMutation<
    Product, // Type of data returned by mutationFn
    Error, // Type of error
    { name: string; price: number } // Type of variables passed to mutationFn
  >({
    mutationFn: addProduct,
    onSuccess: (data) => {
      // Invalidate and refetch the products query
      queryClient.invalidateQueries({ queryKey: ["products"] });
      // Clear the form
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

  const deleteMutation = useMutation<
    { message: string }, // Success response type
    Error, // Error type
    string // Type of variable (productId)
  >({
    mutationFn: deleteProduct,
    onSuccess: (data, productId) => {
      // Invalidate and refetch
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

  // --- Event Handlers ---

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

  // Updated to use the mutation
  const handleDelete = (productId: string) => {
    // Optional: Add a confirmation dialog here
    console.log("Requesting delete for product ID:", productId);
    deleteMutation.mutate(productId);
  };

  // --- Render Logic ---

  if (isLoading) {
    return <div>Loading products...</div>; // Simple loading state
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
      {" "}
      {/* Increased spacing */}
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Products</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage products and set rates.
        </p>
        {/* Save Changes button removed */}
      </div>
      {/* Add New Product Form */}
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
              prefix="$" // Assuming Input supports prefix
              disabled={addMutation.isPending}
            />
          </div>
          {/* Add Button for the form */}
          <div className="md:col-start-3">
            {" "}
            {/* Align button under Price */}
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
      {/* Added Products List */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Current Products</h2>
        {products.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No products found. Add one using the form above.
          </p>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 p-3 border rounded-md bg-card"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow items-center">
                  <div className="md:col-span-2">
                    {/* Consider making these inputs for future editing */}
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(product.id)}
                  disabled={
                    deleteMutation.isPending &&
                    deleteMutation.variables === product.id
                  } // Disable only the button for the product being deleted
                  aria-label={`Delete ${product.name}`}
                >
                  {deleteMutation.isPending &&
                  deleteMutation.variables === product.id ? (
                    <span className="animate-spin h-4 w-4 border-b-2 border-current rounded-full"></span> // Simple spinner
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
