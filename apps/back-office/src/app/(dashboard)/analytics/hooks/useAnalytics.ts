import { FETCH } from "@mcw/utils";
import { useQuery } from "@tanstack/react-query";

interface AnalyticsData {
  income: number;
  incomeChart: Array<{ date: string; value: number }>;
  outstanding: number;
  uninvoiced: number;
  appointments: number;
  appointmentsChart: Array<{ name: string; value: number }>;
  notes: number;
  notesChart: Array<{ name: string; value: number }>;
}

interface TimeRange {
  range: "thisMonth" | "lastMonth" | "last30days" | "thisYear" | "custom";
  startDate?: string;
  endDate?: string;
}

const fetchAnalyticsData = async (
  timeRange: TimeRange,
): Promise<AnalyticsData> => {
  const searchParams: Record<string, string> = { range: timeRange.range };

  if (
    timeRange.range === "custom" &&
    timeRange.startDate &&
    timeRange.endDate
  ) {
    searchParams.startDate = timeRange.startDate;
    searchParams.endDate = timeRange.endDate;
  }

  const response = await FETCH.get({
    url: "/analytics",
    searchParams,
  });

  return response as AnalyticsData;
};

export const useAnalytics = (timeRange: TimeRange) => {
  return useQuery({
    queryKey: ["analytics", timeRange],
    queryFn: () => fetchAnalyticsData(timeRange),
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
};

interface AppointmentStatusData {
  data: Array<{
    id: string;
    dateOfService: string;
    client: string;
    units: number;
    totalFee: string;
    progressNoteStatus: string;
    status: string;
    invoiceStatus: string;
    charge: string;
    uninvoiced: string;
    paid: string;
    unpaid: string;
  }>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

interface AppointmentStatusParams {
  startDate: string;
  endDate: string;
  clientId?: string;
  noteStatus?: "all" | "with_note" | "no_note";
  status?: string;
  page?: number;
  pageSize?: number;
}

const fetchAppointmentStatus = async (
  params: AppointmentStatusParams,
): Promise<AppointmentStatusData> => {
  const response = await FETCH.get({
    url: "/analytics/appointmentStatus",
    searchParams: params as unknown as Record<
      string,
      string | number | boolean
    >,
  });

  return response as AppointmentStatusData;
};

export const useAppointmentStatus = (params: AppointmentStatusParams) => {
  return useQuery({
    queryKey: ["appointmentStatus", params],
    queryFn: () => fetchAppointmentStatus(params),
    enabled: !!params.startDate && !!params.endDate,
  });
};
