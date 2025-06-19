import { useQuery } from "@tanstack/react-query";
import { fetchDiagnosisTreatmentPlans } from "../services/diagnosisTreatmentPlan.service";

export function useDiagnosisTreatmentPlans(clientId: string) {
  return useQuery({
    queryKey: ["diagnosis-treatment-plans", clientId],
    queryFn: () => fetchDiagnosisTreatmentPlans(clientId),
    enabled: !!clientId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
