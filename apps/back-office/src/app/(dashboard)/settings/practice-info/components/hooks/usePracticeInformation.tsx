import { PracticeInformation } from "@/types/profile";
import { toast } from "@mcw/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TeleHealthInfo {
  clinician: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  location: {
    id: string;
    name: string;
    address: string;
    color: string;
    city: string;
    state: string;
    zip: string;
    street: string;
  } | null;
}

const usePracticeInformation = (): {
  practiceInformation: PracticeInformation;
  isLoading: boolean;
  error: Error | null;
} => {
  const {
    data: practiceInformation,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["practiceInformation"],
    queryFn: async () => {
      const res = await fetch("/api/practiceInformation");
      if (!res.ok) {
        throw new Error(`Failed to fetch practice information: ${res.status}`);
      }
      return res.json();
    },
  });

  return { practiceInformation, isLoading, error };
};

export const updatePracticeInfo = async (data: PracticeInformation) => {
  const response = await fetch("/api/practiceInformation", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      practiceName: data.practice_name,
      practiceEmail: data.practice_email,
      timeZone: data.time_zone,
      practiceLogo: data.practice_logo,
      phoneNumbers: data.phone_numbers,
      teleHealth: data.tele_health,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    toast({
      title: "Error updating practice information",
      description: errorData?.error,
      variant: "destructive",
    });
    throw new Error(errorData?.error);
  }
  return response.json();
};

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  return response.json();
}

interface UpdateTeleHealthLocationParams {
  locationId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  color: string;
  street: string;
}

export interface TelehealthFormProps {
  practiceInfoState: PracticeInformation;
  setPracticeInfoState: (practiceInfoState: PracticeInformation) => void;
  onClose: () => void;
}

// Define the form values type
export interface TelehealthFormValues {
  officeName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  color: string;
}

const useTeleHealthInfo = () => {
  const queryClient = useQueryClient();

  const {
    data: teleHealthInfo,
    isLoading,
    error,
  } = useQuery<TeleHealthInfo>({
    queryKey: ["teleHealthInfo"],
    queryFn: async () => {
      const res = await fetch("/api/teleHealth");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error);
      }
      return res.json();
    },
  });

  const updateTeleHealthLocation = useMutation({
    mutationFn: async (params: UpdateTeleHealthLocationParams) => {
      const response = await fetch("/api/teleHealth", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "Error updating telehealth location",
          description: errorData?.error,
          variant: "destructive",
        });
        throw new Error(errorData?.error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teleHealthInfo"] });
      toast({
        title: "Success",
        description: "Telehealth location updated successfully",
      });
    },
  });

  return {
    teleHealthInfo,
    isLoading,
    error,
    updateTeleHealthLocation: updateTeleHealthLocation.mutate,
    isUpdating: updateTeleHealthLocation.isPending,
  };
};

export { usePracticeInformation, uploadFile, useTeleHealthInfo };
