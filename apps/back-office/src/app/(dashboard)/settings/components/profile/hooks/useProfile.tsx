import { ProfileData } from "@/types/profile";
import { useQuery } from "@tanstack/react-query";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<ProfileData> => {
      const response = await fetch("/api/profile");
      if (!response.ok) {
        throw new Error(`Error fetching profile: ${response.status}`);
      }
      return await response.json();
    },
  });
}
