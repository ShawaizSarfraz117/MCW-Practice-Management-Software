"use client";

import { Button, Input } from "@mcw/ui";
import { Trash2 } from "lucide-react";
import { useProduct } from "./useProduct";

const ProductSection = () => {
  const {
    products,
    isLoading,
    editingProducts,
    addProductForm,
    handleSaveChanges,
    handleProductChange,
    deleteProduct,
    isSaving,
  } = useProduct();

  return (
    <div className="p-8 pt-6 w-full min-h-screen bg-[#fafbfb]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] text-[#1F2937] font-600 font-bold mb-1">
            Products
          </h1>
          <p className="text-[#4B5563] text-[16px] font-400">
            Manage products and set rates.
          </p>
        </div>
        <Button
          onClick={handleSaveChanges}
          className="bg-[#2d8467] text-white hover:bg-[#236c53] min-w-[140px]"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-3xl mb-2">
        <div>
          <label className="block text-[#374151] text-[16px] mb-1">
            Product Name
          </label>
          <addProductForm.Field
            name="name"
            children={(field) => (
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="bg-white py-2"
                placeholder="Product Name"
              />
            )}
          />
        </div>
        <div className="w-[50%]">
          <label className="block text-[#374151] text-[16px] mb-1">Price</label>
          <addProductForm.Field
            name="price"
            children={(field) => (
              <Input
                type="number"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="bg-white py-2"
                prefix="$"
                placeholder="$0"
              />
            )}
          />
        </div>
      </div>

      <div className="max-w-3xl mt-2">
        <div className="block text-[#374151] text-[16px] mb-1">
          Added Products
        </div>
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-gray-400">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-gray-400">No products added yet.</div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="grid grid-cols-2 gap-6 items-center"
              >
                <Input
                  value={editingProducts[product.id]?.name ?? product.name}
                  onChange={(e) =>
                    handleProductChange(product.id, "name", e.target.value)
                  }
                  className="bg-white py-2"
                />
                <div className="flex gap-2 items-center w-[50%]">
                  <Input
                    value={editingProducts[product.id]?.price ?? product.price}
                    onChange={(e) =>
                      handleProductChange(product.id, "price", e.target.value)
                    }
                    className="bg-white py-2"
                    prefix="$"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteProduct.mutate(product.id)}
                    className="text-gray-400 hover:text-red-600"
                    aria-label="Delete product"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSection;
