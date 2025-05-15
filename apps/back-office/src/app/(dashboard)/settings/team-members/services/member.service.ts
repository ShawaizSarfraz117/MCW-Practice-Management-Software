import { FETCH } from "@mcw/utils";
import { User, Role, Clinician } from "@prisma/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";
interface UserWithRoleAndClinician extends User {
  UserRole: {
    Role: Role;
  }[];
  Clinician: Clinician | null;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const fetchTeamMembers = async ({
  searchParams = {},
}: {
  searchParams?: {
    search?: string;
    role?: string;
    page?: number;
    pageSize?: number;
  };
}): Promise<
  [PaginatedResponse<UserWithRoleAndClinician> | null, Error | null]
> => {
  try {
    const response = (await FETCH.get({
      url: "/team-members",
      searchParams,
    })) as PaginatedResponse<UserWithRoleAndClinician>;

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

export const useTeamMembers = (
  searchParams: {
    search?: string;
    role?: string;
    page?: number;
    pageSize?: number;
  } = {},
) => {
  return useQuery({
    queryKey: ["team-members", searchParams],
    queryFn: () => fetchTeamMembers({ searchParams }).then(([data]) => data),
  });
};

// Fetch detailed clinical information for a team member
interface ClinicianDetails {
  id: string;
  email: string;
  clinicalInfos?: {
    id: string;
    speciality: string;
    taxonomy_code: string;
    NPI_number: number;
    licenses: {
      id: string;
      license_type: string;
      license_number: string;
      expiration_date: string | Date;
      state: string;
    }[];
  }[];
  Clinician?: {
    id: string;
    first_name: string;
    last_name: string;
    ClinicianServices?: {
      id: string;
      PracticeService: {
        id: string;
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
  try {
    const response: unknown = await FETCH.post({
      url: "/team-members",
      body,
      isFormData: false,
    });

    return [response, null];
  } catch (error) {
    return [null, error];
  }
};

export const useCreateTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
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

export const updateClinicalInfo = async (data: {
  speciality?: string;
  taxonomyCode?: string;
  NPInumber?: number;
  user_id: string;
}) => {
  try {
    const response = await FETCH.update({
      url: "/clinicalInfo",
      method: "PUT",
      body: data,
      isFormData: false,
    });

    return response;
  } catch (error) {
    throw new Error(error as string);
  }
};

export const useUpdateClinicalInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClinicalInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinician-details"] });
      toast({
        title: "Success",
        description: "Clinical information updated successfully",
        variant: "success",
      });
    },
    onError: (_error) => {
      toast({
        title: "Error",
        description: "Failed to update clinical information",
        variant: "destructive",
      });
    },
  });
};

export const updateLicenses = async (data: {
  licenses: Array<{
    id?: number;
    license_type: string;
    license_number: string;
    expiration_date: string;
    state: string;
  }>;
  clinical_info_id: number;
}) => {
  try {
    const response = await FETCH.update({
      url: "/license",
      method: "PUT",
      body: data,
      isFormData: false,
    });

    return response;
  } catch (error) {
    throw new Error(error as string);
  }
};

export const useUpdateLicenses = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLicenses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinician-details"] });
      toast({
        title: "Success",
        description: "License information updated successfully",
        variant: "success",
      });
    },
    onError: (_error) => {
      toast({
        title: "Error",
        description: "Failed to update license information",
        variant: "destructive",
      });
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
