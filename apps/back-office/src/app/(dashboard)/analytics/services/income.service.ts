import { FETCH } from "@mcw/utils";
import { useQuery } from "@tanstack/react-query";

export interface IncomeFilters {
  startDate: string;
  endDate: string;
  clinicianId?: string;
  page?: number;
  limit?: number;
}

export interface IncomeReportItem {
  date: string;
  clientPayments: number;
  grossIncome: number;
  netIncome: number;
  clinicianCut: number;
}

export interface IncomeReportTotals {
  clientPayments: number;
  grossIncome: number;
  netIncome: number;
  clinicianCut: number;
}

export interface IncomeReportResponse {
  data: IncomeReportItem[];
  totals: IncomeReportTotals;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fetchIncomeData = async (
  filters: IncomeFilters,
): Promise<IncomeReportResponse> => {
  try {
    const searchParams = new URLSearchParams();

    searchParams.append("startDate", filters.startDate);
    searchParams.append("endDate", filters.endDate);

    if (filters.clinicianId && filters.clinicianId !== "all") {
      searchParams.append("clinicianId", filters.clinicianId);
    }

    if (filters.page) {
      searchParams.append("page", filters.page.toString());
    }

    if (filters.limit) {
      searchParams.append("limit", filters.limit.toString());
    }

    const response = (await FETCH.get({
      url: "/analytics/income",
      searchParams: Object.fromEntries(searchParams),
    })) as IncomeReportResponse;

    return response;
  } catch (error) {
    throw new Error(
      `Failed to fetch income data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export const useIncomeData = (filters: IncomeFilters) => {
  return useQuery({
    queryKey: ["income-analytics", filters],
    queryFn: () => fetchIncomeData(filters),
    enabled: !!(filters.startDate && filters.endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const exportIncomeData = async (
  format: "csv" | "excel",
  filters: IncomeFilters,
): Promise<Blob> => {
  try {
    const searchParams = new URLSearchParams();

    searchParams.append("startDate", filters.startDate);
    searchParams.append("endDate", filters.endDate);
    searchParams.append("format", format);

    if (filters.clinicianId && filters.clinicianId !== "all") {
      searchParams.append("clinicianId", filters.clinicianId);
    }

    const response = await fetch(
      `/api/analytics/income/export?${searchParams}`,
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
      `Failed to export income data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

// Types for clinician data
export interface ClinicianData {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  address: string;
  percentage_split: number;
  is_active: boolean;
  speciality: string | null;
  NPI_number: string | null;
  taxonomy_code: string | null;
  User: {
    email: string;
  };
}

// Hook to fetch clinicians for filter dropdown
export const useClinicians = () => {
  return useQuery<ClinicianData[]>({
    queryKey: ["clinicians", "income-filter"],
    queryFn: async () => {
      const response = await FETCH.get({
        url: "/clinician",
      });
      return response as ClinicianData[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
