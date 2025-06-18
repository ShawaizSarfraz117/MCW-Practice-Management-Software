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

export interface AttendanceFilters {
  startDate: string;
  endDate: string;
  clientGroupId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AttendanceData {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  client_group_id: string;
  ClientGroup: {
    id: string;
    name: string;
    type: string;
    ClientGroupMembership: Array<{
      Client: {
        legal_first_name: string;
        legal_last_name: string;
        preferred_name: string | null;
      };
    }>;
  };
}

export interface AttendanceResponse {
  data: AttendanceData[];
  summary: {
    totalClients: number;
    totalAppointments: number;
    totalStatuses: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fetchAttendanceData = async (
  filters: AttendanceFilters,
): Promise<AttendanceResponse> => {
  try {
    const searchParams = new URLSearchParams();

    searchParams.append("startDate", filters.startDate);
    searchParams.append("endDate", filters.endDate);

    if (filters.clientGroupId && filters.clientGroupId !== "all") {
      searchParams.append("clientGroupId", filters.clientGroupId);
    }

    if (filters.status && filters.status !== "all") {
      searchParams.append("status", filters.status);
    }

    if (filters.page) {
      searchParams.append("page", filters.page.toString());
    }

    if (filters.limit) {
      searchParams.append("limit", filters.limit.toString());
    }

    const response = (await FETCH.get({
      url: "/analytics/attendees",
      searchParams: Object.fromEntries(searchParams),
    })) as AttendanceResponse;

    return response;
  } catch (error) {
    throw new Error(
      `Failed to fetch attendance data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export const useAttendanceData = (filters: AttendanceFilters) => {
  return useQuery({
    queryKey: ["attendance", filters],
    queryFn: () => fetchAttendanceData(filters),
    enabled: !!(filters.startDate && filters.endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const exportAttendanceData = async (
  format: "csv" | "excel",
  filters: AttendanceFilters,
): Promise<Blob> => {
  try {
    const searchParams = new URLSearchParams();

    searchParams.append("startDate", filters.startDate);
    searchParams.append("endDate", filters.endDate);
    searchParams.append("format", format);

    if (filters.clientGroupId && filters.clientGroupId !== "all") {
      searchParams.append("clientGroupId", filters.clientGroupId);
    }

    if (filters.status && filters.status !== "all") {
      searchParams.append("status", filters.status);
    }

    const response = await fetch(
      `/api/analytics/attendees/export?${searchParams}`,
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
      `Failed to export attendance data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export const useClientGroups = () => {
  return useQuery<PaginatedResponse<ClientGroupWithMembership> | null>({
    queryKey: ["clientGroups", "attendance"],
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
