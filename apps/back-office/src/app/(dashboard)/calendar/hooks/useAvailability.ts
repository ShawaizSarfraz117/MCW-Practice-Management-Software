import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Availability {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
  clinician_id: string;
  allow_online_requests: boolean;
  is_recurring: boolean;
  recurring_rule: string | null;
  service_id?: string;
}

interface AvailabilityCreateInput {
  title?: string;
  clinician_id: string;
  start_date: string;
  end_date: string;
  location?: string;
  allow_online_requests?: boolean;
  is_recurring?: boolean;
  recurring_rule?: string | null;
}

interface AvailabilityUpdateInput extends Partial<AvailabilityCreateInput> {
  id: string;
}

export function useAvailability(id?: string) {
  const queryClient = useQueryClient();

  // Fetch a single availability by ID
  const getAvailability = useQuery<Availability>({
    queryKey: ["availability", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/availability?id=${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch availability");
      }
      return res.json();
    },
    enabled: !!id,
  });

  // Fetch availabilities for a date range and/or clinician
  const getAvailabilities = (
    startDate?: string,
    endDate?: string,
    clinicianId?: string,
  ) => {
    return useQuery<Availability[]>({
      queryKey: ["availabilities", startDate, endDate, clinicianId],
      queryFn: async () => {
        let url = "/api/availability?";

        if (startDate) url += `startDate=${startDate}&`;
        if (endDate) url += `endDate=${endDate}&`;
        if (clinicianId) url += `clinicianId=${clinicianId}`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Failed to fetch availabilities");
        }
        return res.json();
      },
      enabled: !!(startDate && endDate),
    });
  };

  // Create a new availability
  const createAvailability = useMutation({
    mutationFn: async (data: AvailabilityCreateInput) => {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create availability");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate all availability queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["availabilities"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });

  // Update an existing availability
  const updateAvailability = useMutation({
    mutationFn: async (data: AvailabilityUpdateInput) => {
      const { id, ...updateData } = data;

      const res = await fetch(`/api/availability?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update availability");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate specific queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: ["availability", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["availabilities"] });
    },
  });

  // Delete an availability
  const deleteAvailability = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/availability?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete availability");
      }

      return res.json();
    },
    onSuccess: (_, id) => {
      // Invalidate specific queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["availability", id] });
      queryClient.invalidateQueries({ queryKey: ["availabilities"] });
    },
  });

  return {
    getAvailability,
    getAvailabilities,
    createAvailability,
    updateAvailability,
    deleteAvailability,
  };
}
