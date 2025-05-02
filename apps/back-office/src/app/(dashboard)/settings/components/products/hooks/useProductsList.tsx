import { ProductList, LicenseInfo } from "@/types/profile";
import { useQuery } from "@tanstack/react-query";

const useProductsList = (): {
  productList: ProductList[];
  isLoading: boolean;
  error: Error | null;
} => {
  const {
    data: productList,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["productList"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) {
        throw new Error(`Failed to fetch products list: ${res.status}`);
      }
      return res.json();
    },
  });

  return { productList, isLoading, error };
};

const useLicenses = (): {
  licenses: LicenseInfo[];
  isLoading: boolean;
  error: Error | null;
} => {
  const {
    data: licenses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["license"],
    queryFn: async () => {
      const res = await fetch("/api/license");
      if (!res.ok) {
        throw new Error(`Failed to fetch license: ${res.status}`);
      }
      return res.json();
    },
  });

  return { licenses, isLoading, error };
};

export { useProductsList, useLicenses };
