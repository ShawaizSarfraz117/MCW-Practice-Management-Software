import { FETCH } from "@mcw/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";
import { TeamMembersResponse, TeamMembersSearchParams } from "@mcw/types";

// Types for team member operations
export interface UpdateTeamMemberParams {
  id: string;
  specialty?: string;
  npiNumber?: string;
  roles?: string[];
  email?: string;
  firstName?: string;
  lastName?: string;
  license?: {
    type: string;
    number: string;
    expirationDate: string;
    state: string;
  };
}
// Re-export clinical functions for backward compatibility
export {
  updateClinicalInfo,
  useUpdateClinicalInfo,
  updateLicenses,
  useUpdateLicenses,
} from "./clinical.service";

export const fetchTeamMembers = async ({
  searchParams = {},
}: {
  searchParams?: TeamMembersSearchParams;
}): Promise<[TeamMembersResponse | null, Error | null]> => {
  try {
    // Clean up search params to remove undefined values
    const cleanedParams = Object.entries(searchParams).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string | number | boolean>,
    );

    const response = (await FETCH.get({
      url: "/team-members",
      searchParams: cleanedParams,
    })) as TeamMembersResponse;

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

export const useTeamMembers = (searchParams: TeamMembersSearchParams = {}) => {
  return useQuery({
    queryKey: ["team-members", searchParams],
    queryFn: () => fetchTeamMembers({ searchParams }).then(([data]) => data),
  });
};

// Fetch detailed clinical information for a team member
interface ClinicianDetails {
  id: string;
  email: string;
  UserRole?: {
    user_id: string;
    role_id: string;
    Role: {
      id: string;
      name: string;
      description: string | null;
    };
  }[];
  clinicalInfos?: {
    id: string;
    speciality: string;
    taxonomy_code: string;
    NPI_number: number;
  }[];
  Clinician?: {
    id: string;
    first_name: string;
    last_name: string;
    License?: {
      id: string;
      license_type: string;
      license_number: string;
      expiration_date: string | Date;
      state: string;
    }[];
    ClinicianServices?: {
      id: string;
      PracticeService: {
        id: string;
        name: string;
        type: string;
        description?: string;
      };
    }[];
  };
}

export const fetchClinicianDetails = async (
  id: string,
): Promise<[ClinicianDetails | null, Error | null]> => {
  try {
    const response = (await FETCH.get({
      url: "/clinician",
      searchParams: {
        userId: id,
        details: "true",
      },
    })) as ClinicianDetails;

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

export const useClinicianDetails = (id: string) => {
  return useQuery({
    queryKey: ["clinician-details", id],
    queryFn: () => fetchClinicianDetails(id).then(([data]) => data),
    enabled: !!id,
  });
};

export const fetchRoleDetails = async (id: string) => {
  try {
    const response: unknown = await FETCH.get({
      url: "/team-members/role",
      searchParams: {
        userId: id,
        details: "true",
      },
    });

    return response || [];
  } catch (error) {
    return error instanceof Error ? error : new Error("Unknown error");
  }
};

export const useRoleDetails = (id: string) => {
  return useQuery({
    queryKey: ["role-details", id],
    queryFn: () => fetchRoleDetails(id),
    enabled: !!id,
  });
};

export const createTeamMember = async ({ body = {} }) => {
  console.log("createTeamMember called with:", body);
  try {
    const response: unknown = await FETCH.post({
      url: "/team-members",
      body,
      isFormData: false,
    });
    console.log("createTeamMember response:", response);
    return response;
  } catch (error) {
    console.error("createTeamMember error:", error);
    throw error;
  }
};

export const useCreateTeamMember = (options?: {
  onSuccess?: (data: unknown) => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTeamMember,
    onSuccess: (data, _variables, _context) => {
      console.log("Mutation hook onSuccess called with:", data);
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      // Call the custom onSuccess callback if provided
      options?.onSuccess?.(data);
    },
    onError: (error, _variables, _context) => {
      console.log("Mutation hook onError called with:", error);
      // Call the custom onError callback if provided
      options?.onError?.(error);
    },
  });
};

export const updateTeamMember = async (params: UpdateTeamMemberParams) => {
  try {
    const response: unknown = await FETCH.update({
      url: "/team-members",
      method: "PUT",
      body: params,
      isFormData: false,
    });

    return response;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to update team member",
    );
  }
};

export const createOrUpdateTeamMember = async (params: {
  id: string;
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    address?: string;
    percentage_split?: number;
    is_active?: boolean;
    [key: string]: unknown;
  };
}) => {
  try {
    const { id, data } = params;
    const response: unknown = await FETCH.update({
      url: "/clinician",
      body: {
        ...data,
        id,
        user_id: id,
      },
      isFormData: false,
    });

    return response;
  } catch (error) {
    throw new Error(error as string);
  }
};

export const useUpdateTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, UpdateTeamMemberParams>({
    mutationFn: updateTeamMember,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clinician-details", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
};

export const useCreateOrUpdateTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrUpdateTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinician-details"] });
      toast({
        title: "Success",
        description: "Team member updated successfully",
        variant: "success",
      });
    },
    onError: (_error) => {
      toast({
        title: "Error",
        description: "Failed to update team member",
        variant: "destructive",
      });
    },
  });
};

// Using update method with DELETE method parameter instead of delete method
export const deleteTeamMember = async (id: string) => {
  try {
    const response: unknown = await FETCH.update({
      url: `/team-members?id=${id}`,
      method: "DELETE",
      body: {},
      isFormData: false,
    });

    return [response, null];
  } catch (error) {
    return [null, error];
  }
};

export const useDeleteTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
};

// Practice service interface
interface PracticeService {
  id: string;
  type: string;
  code: string;
  description?: string;
  rate?: number;
  duration?: number;
  color?: string;
}

// Fetch available practice services for selection
export const fetchPracticeServices = async (): Promise<
  [PracticeService[] | null, Error | null]
> => {
  try {
    const response = (await FETCH.get({
      url: "/service",
    })) as PracticeService[];

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

export const usePracticeServices = () => {
  return useQuery({
    queryKey: ["service"],
    queryFn: () => fetchPracticeServices().then(([data]) => data),
  });
};

// Update clinician services
export const updateClinicianServices = async (data: {
  clinician_id: string;
  service_ids: string[];
  custom_rate?: number | null;
  is_active?: boolean;
}) => {
  try {
    const response = await FETCH.update({
      url: "/clinician/services",
      method: "PUT",
      body: data,
      isFormData: false,
    });

    return response;
  } catch (error) {
    throw new Error(error as string);
  }
};

export const useUpdateClinicianServices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClinicianServices,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinician-details"] });
      toast({
        title: "Success",
        description: "Services updated successfully",
        variant: "success",
      });
    },
    onError: (_error) => {
      toast({
        title: "Error",
        description: "Failed to update services",
        variant: "destructive",
      });
    },
  });
};
