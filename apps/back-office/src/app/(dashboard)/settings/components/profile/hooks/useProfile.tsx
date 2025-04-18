import { useQuery } from "@tanstack/react-query";

type ProfileData = {
  created_at: string;
  date_of_birth: string;
  id: string;
  phone: string;
  profile_photo: string;
  updated_at: string;
  user_id: string;
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<ProfileData> => {
      const response = await fetch("api/profile");
      return await response.json();
    },
  });
}
