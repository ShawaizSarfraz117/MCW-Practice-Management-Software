export interface DiagnosisItem {
  id: string;
  code: string;
  description: string;
}

export interface DiagnosisTreatmentPlanItem {
  id: string;
  treatment_plan_id: string;
  diagnosis_id: string;
  custom_description: string | null;
  Diagnosis: DiagnosisItem;
}

export interface SurveyAnswers {
  id: string;
  template_id: string;
  client_id: string;
  client_group_id: string | null;
  content: string;
  status: string;
  assigned_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiagnosisTreatmentPlan {
  id: string;
  client_id: string;
  client_group_id: string | null;
  created_at: string;
  updated_at: string | null;
  is_signed: string | null;
  title: string;
  survey_answers_id: string | null;
  DiagnosisTreatmentPlanItem: DiagnosisTreatmentPlanItem[];
  SurveyAnswers?: SurveyAnswers | null;
}

export async function fetchDiagnosisTreatmentPlans(
  clientId: string,
): Promise<DiagnosisTreatmentPlan[]> {
  try {
    const res = await fetch(
      `/api/diagnosis-treatment-plan?clientId=${clientId}`,
    );

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ error: "Failed to fetch diagnosis treatment plans" }));
      throw new Error(
        error.error || "Failed to fetch diagnosis treatment plans",
      );
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching diagnosis treatment plans:", error);
    throw error;
  }
}

export async function fetchDiagnosisTreatmentPlanById(
  planId: string,
): Promise<DiagnosisTreatmentPlan> {
  try {
    const res = await fetch(`/api/diagnosis-treatment-plan?planId=${planId}`);

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ error: "Failed to fetch diagnosis treatment plan" }));
      throw new Error(
        error.error || "Failed to fetch diagnosis treatment plan",
      );
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching diagnosis treatment plan:", error);
    throw error;
  }
}

export async function deleteDiagnosisTreatmentPlan(
  planId: string,
): Promise<{ message: string }> {
  try {
    const res = await fetch(`/api/diagnosis-treatment-plan?id=${planId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ error: "Failed to delete diagnosis treatment plan" }));
      throw new Error(
        error.error || "Failed to delete diagnosis treatment plan",
      );
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error deleting diagnosis treatment plan:", error);
    throw error;
  }
}
