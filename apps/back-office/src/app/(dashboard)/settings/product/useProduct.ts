import { useForm } from "@tanstack/react-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
}

export const useProduct = () => {
  const queryClient = useQueryClient();
  const [editingProducts, setEditingProducts] = useState<
    Record<string, { name: string; price: number }>
  >({});

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/product");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const addProduct = useMutation({
    mutationFn: async (values: { name: string; price: number }) => {
      const res = await fetch("/api/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to add product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const editProduct = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: { name: string; price: number };
    }) => {
      const res = await fetch(`/api/product?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to edit product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditingProducts({});
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/product?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const addProductForm = useForm({
    defaultValues: {
      name: "",
      price: "",
    },
    onSubmit: async ({ value, formApi }) => {
      await addProduct.mutateAsync({
        name: value.name,
        price: Number(value.price) || 0,
      });
      formApi.reset();
    },
  });

  const editProductForm = useForm({
    defaultValues: {
      name: "",
      price: "",
    },
    onSubmit: async ({ formApi }) => {
      const editPromises = Object.entries(editingProducts).map(([id, values]) =>
        editProduct.mutateAsync({ id, values }),
      );
      await Promise.all(editPromises);
      formApi.reset();
    },
  });

  const handleSaveChanges = async () => {
    const promises = [];

    if (addProductForm.state.values.name || addProductForm.state.values.price) {
      promises.push(addProductForm.handleSubmit());
    }
    if (Object.keys(editingProducts).length > 0) {
      promises.push(editProductForm.handleSubmit());
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  };

  const handleProductChange = (
    id: string,
    field: "name" | "price",
    value: string,
  ) => {
    setEditingProducts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: field === "price" ? Number(value) || 0 : value,
      },
    }));
  };

  return {
    products,
    isLoading,
    editingProducts,
    addProductForm,
    editProductForm,
    handleSaveChanges,
    handleProductChange,
    deleteProduct,
    isSaving: editProduct.isPending || addProduct.isPending,
  };
};
