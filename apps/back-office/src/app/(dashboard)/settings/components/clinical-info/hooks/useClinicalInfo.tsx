import { useQuery } from "@tanstack/react-query";

const useClinicalInfo = () => {
  const { data: clinicalInfo } = useQuery({
    queryKey: ["clinicalInfo"],
    queryFn: () => fetch("/api/clinicalInfo").then((res) => res.json()),
  });

  return clinicalInfo;
};

const useLicenses = () => {
  const { data: licenses } = useQuery({
    queryKey: ["license"],
    queryFn: () => fetch("/api/license").then((res) => res.json()),
  });

  return licenses;
};

export { useClinicalInfo, useLicenses };
