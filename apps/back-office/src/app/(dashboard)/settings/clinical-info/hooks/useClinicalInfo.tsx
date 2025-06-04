import { ClinicalInfo, LicenseInfo } from "@/types/profile";
import { useQuery } from "@tanstack/react-query";

const useClinicalInfo = (): {
  clinicalInfo: ClinicalInfo;
  isLoading: boolean;
  error: Error | null;
} => {
  const {
    data: clinicalInfo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["clinicalInfo"],
    queryFn: async () => {
      const res = await fetch("/api/clinicalInfo");
      if (!res.ok) {
        throw new Error(`Failed to fetch clinical info: ${res.status}`);
      }
      return res.json();
    },
  });

  return { clinicalInfo, isLoading, error };
};

const useLicenses = (): {
  licenses: LicenseInfo[];
  isLoading: boolean;
  error: Error | null;
} => {
  const {
    data: licenses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["license"],
    queryFn: async () => {
      const res = await fetch("/api/license");
      if (!res.ok) {
        throw new Error(`Failed to fetch license: ${res.status}`);
      }
      return res.json();
    },
  });

  return { licenses, isLoading, error };
};

export { useClinicalInfo, useLicenses };
