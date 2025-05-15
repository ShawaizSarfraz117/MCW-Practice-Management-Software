"use client";

import { useQuery } from "@tanstack/react-query";
import { ProfileData } from "../../types";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<ProfileData> => {
      const response = await fetch("/api/profile");
      if (!response.ok) {
        throw new Error(`Error fetching profile: ${response.status}`);
      }
      const data = await response.json();
      // If API doesn't provide a name directly, we could add fallback logic here
      // For example: data.name = "User Name"; // fallback name
      return data;
    },
  });
}
