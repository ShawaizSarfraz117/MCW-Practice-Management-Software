import { FETCH } from "@mcw/utils";
import { useQuery } from "@tanstack/react-query";
import {
  fetchClientGroups,
  ClientGroupWithMembership,
} from "@/(dashboard)/clients/services/client.service";

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface AppointmentStatusFilters {
  startDate: string;
  endDate: string;
  page?: number;
  limit?: number;
  clientGroupId?: string;
}

export interface AppointmentStatusItem {
  appointmentId: string;
  clientGroupId: string;
  dateOfService: string;
  client: string;
  billingCode: string;
  ratePerUnit: number;
  units: number;
  totalFee: number;
  status: string;
  charge: number;
  uninvoiced: number;
  paid: number;
  unpaid: number;
}

export interface AppointmentStatusResponse {
  data: AppointmentStatusItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fetchAppointmentStatus = async (
  filters: AppointmentStatusFilters,
): Promise<AppointmentStatusResponse> => {
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

    if (filters.clientGroupId) {
      searchParams.append("clientGroupId", filters.clientGroupId);
    }

    const response = (await FETCH.get({
      url: "/analytics/appointment-status",
      searchParams: Object.fromEntries(searchParams),
    })) as AppointmentStatusResponse;

    return response;
  } catch (error) {
    throw new Error(
      `Failed to fetch appointment status: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export const useAppointmentStatus = (filters: AppointmentStatusFilters) => {
  return useQuery({
    queryKey: ["appointment-status", filters],
    queryFn: () => fetchAppointmentStatus(filters),
    enabled: !!(filters.startDate && filters.endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useClientGroups = () => {
  return useQuery<PaginatedResponse<ClientGroupWithMembership> | null>({
    queryKey: ["clientGroups", "appointment-status"],
    queryFn: async () => {
      const [response, error] = await fetchClientGroups({
        searchParams: {
          limit: 300, // Get all client groups for dropdown
          is_active: true,
        },
      });

      if (error) {
        throw error;
      }

      return response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const exportAppointmentStatus = async (
  format: "csv" | "excel",
  filters: AppointmentStatusFilters,
): Promise<Blob> => {
  try {
    const searchParams = new URLSearchParams();

    searchParams.append("startDate", filters.startDate);
    searchParams.append("endDate", filters.endDate);
    searchParams.append("format", format);

    if (filters.clientGroupId) {
      searchParams.append("clientGroupId", filters.clientGroupId);
    }

    const response = await fetch(
      `/api/analytics/appointment-status/export?${searchParams}`,
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
      `Failed to export appointment status: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};
