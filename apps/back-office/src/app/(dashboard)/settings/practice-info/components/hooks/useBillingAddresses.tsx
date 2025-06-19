import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";

export interface BillingAddress {
  id: string | undefined;
  street: string | undefined;
  city: string | undefined;
  state: string | undefined;
  zip: string | undefined;
  type: "business" | "client";
}

interface CreateBillingAddressParams {
  street: string | undefined;
  city: string | undefined;
  state: string | undefined;
  zip: string | undefined;
  type: "business" | "client";
}

const useBillingAddresses = () => {
  const queryClient = useQueryClient();

  const {
    data: billingAddresses,
    isLoading,
    error,
  } = useQuery<BillingAddress[]>({
    queryKey: ["billingAddresses"],
    queryFn: async () => {
      const res = await fetch("/api/billingAddress");
      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage =
          typeof errorData?.error === "string"
            ? errorData.error
            : errorData?.error?.message || "Failed to fetch billing addresses";
        throw new Error(errorMessage);
      }
      const data = await res.json();
      return data.billingAddresses;
    },
  });

  const createBillingAddress = useMutation({
    mutationFn: async (params: CreateBillingAddressParams) => {
      const response = await fetch("/api/billingAddress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          typeof errorData?.error === "string"
            ? errorData.error
            : errorData?.error?.message || "Failed to create billing address";

        toast({
          title: "Error creating billing address",
          description: errorMessage,
          variant: "destructive",
        });
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billingAddresses"] });
      toast({
        title: "Success",
        description: "Billing address created successfully",
      });
    },
  });

  return {
    billingAddresses,
    isLoading,
    error,
    createBillingAddress: createBillingAddress.mutate,
    isCreating: createBillingAddress.isPending,
  };
};

export default useBillingAddresses;
