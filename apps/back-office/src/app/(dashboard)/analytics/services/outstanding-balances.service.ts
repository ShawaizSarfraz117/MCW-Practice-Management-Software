import { FETCH } from "@mcw/utils";
import { useQuery } from "@tanstack/react-query";

export interface OutstandingBalanceFilters {
  startDate: string;
  endDate: string;
  page?: number;
  limit?: number;
}

export interface OutstandingBalanceItem {
  clientGroupId: string;
  clientGroupName: string;
  servicesProvided: number;
  uninvoiced: number;
  invoiced: number;
  clientPaid: number;
  clientBalance: number;
}

export interface OutstandingBalanceTotals {
  servicesProvided: number;
  uninvoiced: number;
  invoiced: number;
  clientPaid: number;
  clientBalance: number;
}

export interface OutstandingBalanceResponse {
  data: OutstandingBalanceItem[];
  totals: OutstandingBalanceTotals;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fetchOutstandingBalances = async (
  filters: OutstandingBalanceFilters,
): Promise<OutstandingBalanceResponse> => {
  try {
    const searchParams = new URLSearchParams();

    searchParams.append("startDate", filters.startDate);
    searchParams.append("endDate", filters.endDate);

    if (filters.page) {
      searchParams.append("page", filters.page.toString());
    }

    if (filters.limit) {
      searchParams.append("limit", filters.limit.toString());
    }

    const response = (await FETCH.get({
      url: "/analytics/outstanding-balances",
      searchParams: Object.fromEntries(searchParams),
    })) as OutstandingBalanceResponse;

    return response;
  } catch (error) {
    throw new Error(
      `Failed to fetch outstanding balances: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export const useOutstandingBalances = (filters: OutstandingBalanceFilters) => {
  return useQuery({
    queryKey: ["outstanding-balances", filters],
    queryFn: () => fetchOutstandingBalances(filters),
    enabled: !!(filters.startDate && filters.endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const exportOutstandingBalances = async (
  format: "csv" | "excel",
  filters: OutstandingBalanceFilters,
): Promise<Blob> => {
  try {
    const searchParams = new URLSearchParams();

    searchParams.append("startDate", filters.startDate);
    searchParams.append("endDate", filters.endDate);
    searchParams.append("format", format);

    const response = await fetch(
      `/api/analytics/outstanding-balances/export?${searchParams}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    throw new Error(
      `Failed to export outstanding balances: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};
