import { PracticeInformation } from "@/types/profile";
import { toast } from "@mcw/ui";
import { useQuery } from "@tanstack/react-query";

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
export { usePracticeInformation, uploadFile };
