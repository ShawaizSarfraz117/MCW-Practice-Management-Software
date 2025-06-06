import { FETCH } from "@mcw/utils";
import { SurveyTemplate, SurveyAnswers } from "@prisma/client";

interface SurveyTemplateWithAnswers extends SurveyTemplate {
  SurveyAnswers?: (SurveyAnswers & {
    Client?: {
      id: string;
      legal_first_name: string;
      legal_last_name: string;
      preferred_first_name: string | null;
    };
    Appointment?: {
      id: string;
      start_date: Date;
      end_date: Date;
      type: string;
    };
  })[];
}

interface PaginatedSurveyTemplateResponse {
  data: SurveyTemplateWithAnswers[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fetchSurveyTemplates = async ({
  type,
  clientId,
  includeAnswers = true,
  isActive,
  page = 1,
  limit = 20,
}: {
  type?: string;
  clientId?: string;
  includeAnswers?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<[PaginatedSurveyTemplateResponse | null, Error | null]> => {
  try {
    const searchParams: Record<string, string | number | boolean> = {
      page,
      limit,
      include_answers: includeAnswers,
    };

    if (type) {
      searchParams.type = type;
    }

    if (clientId) {
      searchParams.client_id = clientId;
    }

    if (isActive !== undefined) {
      searchParams.is_active = isActive;
    }

    const response = (await FETCH.get({
      url: "/survey-templates",
      searchParams,
    })) as PaginatedSurveyTemplateResponse;

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

export const createSurveyTemplate = async ({
  body,
}: {
  body: {
    name: string;
    description?: string;
    type: string;
    content: unknown;
    is_active?: boolean;
    frequency_options?: unknown;
    is_default?: boolean;
    requires_signature?: boolean;
    is_shareable?: boolean;
  };
}): Promise<
  [{ template: SurveyTemplate; message: string } | null, Error | null]
> => {
  try {
    const response = (await FETCH.post({
      url: "/survey-templates",
      body,
      isFormData: false,
    })) as { template: SurveyTemplate; message: string };

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

// Helper function to fetch mental status exam templates with their answers
export const fetchMentalStatusExamTemplatesWithAnswers = async ({
  clientId,
  isActive = true,
  page = 1,
  limit = 20,
}: {
  clientId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<[PaginatedSurveyTemplateResponse | null, Error | null]> => {
  return fetchSurveyTemplates({
    type: "MENTAL_STATUS_EXAM",
    clientId,
    includeAnswers: true,
    isActive,
    page,
    limit,
  });
};

// Helper function to fetch all template types without answers
export const fetchTemplateTypes = async ({
  isActive = true,
}: {
  isActive?: boolean;
}): Promise<[SurveyTemplate[] | null, Error | null]> => {
  try {
    const [response, error] = await fetchSurveyTemplates({
      includeAnswers: false,
      isActive,
      page: 1,
      limit: 100, // Get all types
    });

    if (error || !response) {
      return [null, error];
    }

    // Group by type and return unique types
    const uniqueTypes = response.data.reduce((acc, template) => {
      if (!acc.find((t) => t.type === template.type)) {
        acc.push(template);
      }
      return acc;
    }, [] as SurveyTemplate[]);

    return [uniqueTypes, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};
