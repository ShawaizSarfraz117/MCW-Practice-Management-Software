export interface SurveyTemplate {
  id: string;
  name: string;
  content: Record<string, unknown>;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SurveyTemplatesResponse {
  data: SurveyTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchSurveyTemplates(
  type?: string,
  isActive?: boolean,
): Promise<SurveyTemplatesResponse> {
  try {
    const params = new URLSearchParams();

    if (type) {
      params.append("type", type);
    }

    if (isActive !== undefined) {
      params.append("is_active", String(isActive));
    }

    params.append("include_answers", "false");

    const res = await fetch(`/api/survey-templates?${params.toString()}`);

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ error: "Failed to fetch survey templates" }));
      throw new Error(error.error || "Failed to fetch survey templates");
    }

    const data = await res.json();

    // Ensure we always return a valid response structure
    return {
      data: data.data || [],
      pagination: data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };
  } catch (error) {
    console.error("Error fetching survey templates:", error);

    // For debugging: if it's a fetch error, let it bubble up
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw error;
    }

    // For auth errors (401), let them bubble up so UI can show appropriate message
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      throw error;
    }

    // Return empty response for other errors to prevent app crashes
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };
  }
}
