"use client";

import { Button, toast } from "@mcw/ui";
import { useEffect, useState } from "react";
import ProductsBillingForm from "./ProductsBillingForm";
import { useProductsList } from "./hooks/useProductsList";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function ProductsBilling() {
  const queryClient = useQueryClient();
  const { productList } = useProductsList();
  const [apiData, setApiData] = useState({});
  const [products, setProducts] = useState<
    Array<{ id?: string; name: string; price: string }>
  >([{ name: "", price: "" }]);

  const isInputEmpty = () => {
    // Check if any existing product has empty fields
    const hasEmptyExistingProducts = products
      .slice(1)
      .some(
        (product) => product.name.trim() === "" || product.price.trim() === "",
      );

    // Get the input form (first product)
    const inputForm = products[0];
    const isInputFormPartiallyFilled = hasEmptyExistingProducts
      ? inputForm.name.trim() === "" || inputForm.price.trim() === ""
      : false;

    // If there are empty existing products, always disable save
    if (hasEmptyExistingProducts) {
      return true;
    }

    // If all existing products are filled:
    // - Allow save if input form is completely empty (editing mode)
    // - Disable save if input form is partially filled (adding mode)
    return isInputFormPartiallyFilled;
  };

  useEffect(() => {
    if (productList) {
      setProducts([{ id: "", name: "", price: "" }, ...productList]);
    }
    console.log("products ", products);
  }, [productList]);

  const updateProduct = (
    index: number,
    updatedProduct: { id: string; name: string; price: string },
  ) => {
    const newProducts = [...products];
    newProducts[index] = updatedProduct;
    setApiData(updatedProduct);
    setProducts(newProducts);
    console.log("data ", apiData);
  };

  const handleProductSave = () => {
    if (isInputEmpty() == true) {
      toast({
        title: "Invalid Product Information",
        description: "Product information is not valid",
        variant: "destructive",
      });
      return;
    }
    mutate();
  };

  const handleDelete = async (index: number, productId: string) => {
    const newProducts = [...products];
    newProducts.splice(index, 1);

    const response = await fetch("/api/products", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: productId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      toast({
        title: "Error deleting product information",
        description: errorData?.error,
        variant: "destructive",
      });
      throw new Error(errorData?.error);
    } else {
      setProducts(newProducts);
      toast({
        title: "Product information deleted successfully",
        description: "Product information has been deleted successfully",
        variant: "success",
      });
    }

    // return response.json();
  };

  // Function to update product info
  const updateProductInfo = async () => {
    const lastProduct = products[0];

    if (lastProduct.name.trim() !== "" || lastProduct.price.trim() !== "") {
      const newProducts = [...products];

      setApiData(lastProduct);
      newProducts.unshift({
        id: lastProduct.id,
        name: lastProduct.name,
        price: lastProduct.price,
      });

      setProducts(newProducts);
      newProducts[0] = { id: "", name: "", price: "" };
    }
    const response = await fetch("/api/products", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      toast({
        title: "Error updating product information",
        description: errorData?.error,
        variant: "destructive",
      });
      throw new Error(errorData?.error);
    }

    return response.json();
  };

  const { mutate } = useMutation({
    mutationFn: updateProductInfo,
    onSuccess: (data) => {
      // Optionally handle success (e.g., show a success message)
      queryClient.refetchQueries({ queryKey: ["products"] });
      console.log("Product information updated successfully", data);
      setProducts((prevProducts) => {
        const updatedProducts = [...prevProducts];
        updatedProducts[1] = {
          ...updatedProducts[1],
          id: data.id,
        };
        return updatedProducts;
      });
      toast({
        title: "Product information updated successfully",
        description: "Product information has been updated successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      // Optionally handle error (e.g., show an error message)
      console.error("Error updating product information:", error);
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Products</h1>
          <p className="text-gray-600 mt-1">Manage products and set rates</p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
          disabled={isInputEmpty()}
          onClick={handleProductSave}
        >
          Save Changes
        </Button>
      </div>

      <ProductsBillingForm
        index={0}
        productInfo={products[0]}
        setProductInfo={(updatedProduct) =>
          updateProduct(0, { ...updatedProduct, id: products[0].id || "" })
        }
      />
      {products?.slice(1).map((product, index) => {
        const arrIndex = index + 1;

        return (
          <div key={arrIndex} className="mt-4">
            <ProductsBillingForm
              index={arrIndex}
              productInfo={product}
              setProductInfo={(updatedProduct) =>
                updateProduct(arrIndex, {
                  ...updatedProduct,
                  id: product.id || "",
                })
              }
              onDelete={() => handleDelete(arrIndex, product.id || "")}
            />
          </div>
        );
      })}
      {(!products || products.length === 0) && (
        <p className="text-sm text-gray-600 mt-5">No Products Found</p>
      )}
    </div>
  );
}
