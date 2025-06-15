import { useInfiniteQuery } from "@tanstack/react-query";
import { ClientOverviewResponse, DocumentType } from "@mcw/types";

interface UseClientOverviewParams {
  clientGroupId: string;
  startDate?: Date;
  endDate?: Date;
  itemType?: DocumentType | "all";
  enabled?: boolean;
}

export const useClientOverview = ({
  clientGroupId,
  startDate,
  endDate,
  itemType = "all",
  enabled = true,
}: UseClientOverviewParams) => {
  return useInfiniteQuery<ClientOverviewResponse>({
    queryKey: ["client-overview", clientGroupId, startDate, endDate, itemType],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        clientGroupId,
        page: String(pageParam),
        limit: "10",
      });

      if (itemType && itemType !== "all") {
        params.append("itemType", itemType);
      }

      if (startDate) {
        params.append("startDate", startDate.toISOString());
      }

      if (endDate) {
        params.append("endDate", endDate.toISOString());
      }

      const response = await fetch(`/api/client/overview?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch client overview");
      }

      return response.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: enabled && !!clientGroupId,
  });
};
