"use client";

import { useState } from "react";
import { Button, Input, Label } from "@mcw/ui";
import { Trash2 } from "lucide-react";

// Mock data type (replace with Prisma type later)
interface Product {
  id: string;
  name: string;
  price: number;
}

export default function ProductsPage() {
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState(""); // Store as string for input flexibility
  const [products, setProducts] = useState<Product[]>([
    // Mock data based on screenshot
    { id: "1", name: "Product #2", price: 150 },
    // Add more mock products if needed
  ]);

  // TODO: Implement handleSave function
  const handleSave = () => {
    console.log("Save changes clicked");
    // API call to save new/updated products will go here
  };

  // TODO: Implement handleDelete function
  const handleDelete = (productId: string) => {
    console.log("Delete product clicked:", productId);
    // Update state (and later call API)
    setProducts(products.filter((p) => p.id !== productId));
  };

  // Basic price validation/formatting could be added here if needed

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage products and set rates.
          </p>
        </div>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>

      {/* Add New Product Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <Label htmlFor="productName">Product Name</Label>
          <Input
            id="productName"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            placeholder="Enter product name"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="productPrice">Price</Label>
          <Input
            id="productPrice"
            type="number" // Use number type for better input control
            value={newProductPrice}
            onChange={(e) => setNewProductPrice(e.target.value)}
            placeholder="0.00"
            min="0" // Prevent negative prices
            step="0.01" // Allow cents
            className="mt-1"
            // Add prefix or formatting if needed via a custom component or library later
            prefix="$" // Simple prefix for now
          />
          {/* Displaying the prefix '$' might require adjustments based on the Input component's capability or using a wrapper */}
        </div>
        {/* Add button could go here if adding one by one */}
      </div>

      {/* Added Products List */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Added Products</h2>
        {products.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No products added yet.
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
                    {/* Displaying existing product name - could be Input for editing */}
                    <Input
                      value={product.name}
                      readOnly
                      className="mt-1 bg-muted/50"
                    />
                  </div>
                  <div>
                    {/* Displaying existing product price - could be Input for editing */}
                    <Input
                      value={product.price.toFixed(2)}
                      readOnly
                      className="mt-1 bg-muted/50"
                      prefix="$"
                    />
                    {/* Displaying the prefix '$' might require adjustments */}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(product.id)}
                  aria-label="Delete product"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
