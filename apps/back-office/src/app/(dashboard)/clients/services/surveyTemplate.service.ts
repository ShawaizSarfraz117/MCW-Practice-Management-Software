import { FETCH } from "@mcw/utils";
import { SurveyTemplate } from "@prisma/client";

interface SurveyTemplateResponse {
  data: SurveyTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fetchSurveyTemplates = async ({
  searchParams = {},
}): Promise<[SurveyTemplateResponse | null, Error | null]> => {
  try {
    const response = (await FETCH.get({
      url: "/survey-templates",
      searchParams,
    })) as SurveyTemplateResponse;

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

export const fetchSurveyTemplateByType = async (
  type: string,
): Promise<[SurveyTemplate | null, Error | null]> => {
  try {
    const response = (await FETCH.get({
      url: "/survey-templates",
      searchParams: { type, limit: "1" },
    })) as SurveyTemplateResponse;
    console.log("🚀 ~ response:", response);

    if (response.data && response.data.length > 0) {
      return [response.data[0], null];
    }

    return [null, new Error("Survey template not found")];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

export const fetchSurveyTemplateByName = async (
  name: string,
): Promise<[SurveyTemplate | null, Error | null]> => {
  try {
    const response = (await FETCH.get({
      url: "/survey-templates",
      searchParams: { limit: "100" }, // Get more templates to search through
    })) as SurveyTemplateResponse;

    if (response.data && response.data.length > 0) {
      // Find template by name (case-insensitive match)
      const template = response.data.find((t) =>
        t.name.toLowerCase().includes(name.toLowerCase()),
      );

      if (template) {
        return [template, null];
      }
    }

    return [null, new Error(`Survey template with name "${name}" not found`)];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};
