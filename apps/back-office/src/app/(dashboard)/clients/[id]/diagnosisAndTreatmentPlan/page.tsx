"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DiagnosisAndTreatmentPlan() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect to the /new route
    router.push(`/clients/${params.id}/diagnosisAndTreatmentPlan/new`);
  }, [params.id, router]);

  return null; // Return null while redirecting
}
