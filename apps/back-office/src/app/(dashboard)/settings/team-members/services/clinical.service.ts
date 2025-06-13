import { FETCH, showErrorToast } from "@mcw/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";

export const updateClinicalInfo = async (data: {
  speciality?: string;
  taxonomyCode?: string;
  NPInumber?: number;
  user_id: string;
}) => {
  const response = await FETCH.update({
    url: "/clinicalInfo",
    method: "PUT",
    body: data,
    isFormData: false,
  });

  return response;
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
    onError: (error: unknown) => {
      showErrorToast(toast, error);
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
