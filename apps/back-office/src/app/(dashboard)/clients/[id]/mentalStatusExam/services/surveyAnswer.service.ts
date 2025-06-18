import { FETCH } from "@mcw/utils";
import { SurveyAnswers } from "@prisma/client";

interface SurveyAnswerContent {
  [key: string]: string;
}

interface SurveyAnswerWithRelations extends Omit<SurveyAnswers, "content"> {
  content: SurveyAnswerContent | null;
  SurveyTemplate: {
    id: string;
    name: string;
    type: string;
    description: string | null;
    content?: SurveyAnswerContent;
  };
  Client: {
    id: string;
    legal_first_name: string;
    legal_last_name: string;
    preferred_name: string | null;
    date_of_birth?: Date | null;
  };
  Appointment?: {
    id: string;
    start_date: Date;
    end_date: Date;
    type: string;
  } | null;
}

interface CreateSurveyAnswerResponse extends Omit<SurveyAnswers, "content"> {
  content: SurveyAnswerContent | null;
  SurveyTemplate: {
    id: string;
    name: string;
    type: string;
    description: string | null;
  };
  Client: {
    id: string;
    legal_first_name: string;
    legal_last_name: string;
    preferred_name: string | null;
  };
  Appointment?: {
    id: string;
    start_date: Date;
    end_date: Date;
  } | null;
}

interface SurveyAnswersListResponse {
  data: SurveyAnswerWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Create a new survey answer
export const createSurveyAnswer = async ({
  template_id,
  client_id,
  appointment_id,
  content,
  status = "PENDING",
  client_group_id,
}: {
  template_id: string;
  client_id: string;
  appointment_id?: string | null;
  content?: SurveyAnswerContent;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  client_group_id?: string | null;
}): Promise<[CreateSurveyAnswerResponse | null, Error | null]> => {
  try {
    const response = (await FETCH.post({
      url: "/survey-answers",
      body: {
        template_id,
        client_id,
        appointment_id,
        content,
        status,
        client_group_id,
      },
      isFormData: false,
    })) as CreateSurveyAnswerResponse;

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

// Fetch a single survey answer by ID
export const fetchSurveyAnswer = async ({
  id,
}: {
  id: string;
}): Promise<[SurveyAnswerWithRelations | null, Error | null]> => {
  try {
    const response = (await FETCH.get({
      url: `/survey-answers/${id}`,
    })) as SurveyAnswerWithRelations;

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

// Update a survey answer
export const updateSurveyAnswer = async ({
  id,
  content,
  status,
  appointment_id,
}: {
  id: string;
  content?: SurveyAnswerContent;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  appointment_id?: string | null;
}): Promise<[SurveyAnswerWithRelations | null, Error | null]> => {
  try {
    const response = (await FETCH.update({
      url: `/survey-answers/${id}`,
      body: {
        content,
        status,
        appointment_id,
      },
      isFormData: false,
    })) as SurveyAnswerWithRelations;

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

// Delete a survey answer
export const deleteSurveyAnswer = async ({
  id,
}: {
  id: string;
}): Promise<
  [{ message: string; survey_answer: SurveyAnswers } | null, Error | null]
> => {
  try {
    const response = (await FETCH.remove({
      url: `/survey-answers/${id}`,
    })) as { message: string; survey_answer: SurveyAnswers };

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

// Fetch survey answers with filters
export const fetchSurveyAnswers = async ({
  client_id,
  template_id,
  template_type,
  status,
  appointment_id,
  page = 1,
  limit = 20,
}: {
  client_id?: string;
  template_id?: string;
  template_type?: string;
  status?: string;
  appointment_id?: string;
  page?: number;
  limit?: number;
}): Promise<[SurveyAnswersListResponse | null, Error | null]> => {
  try {
    const searchParams: Record<string, string> = {};

    if (client_id) searchParams.client_id = client_id;
    if (template_id) searchParams.template_id = template_id;
    if (template_type) searchParams.template_type = template_type;
    if (status) searchParams.status = status;
    if (appointment_id) searchParams.appointment_id = appointment_id;
    searchParams.page = page.toString();
    searchParams.limit = limit.toString();

    const response = (await FETCH.get({
      url: "/survey-answers",
      searchParams,
    })) as SurveyAnswersListResponse;

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

// Helper function specifically for mental status exam
export const createMentalStatusExamAnswer = async ({
  client_id,
  template_id,
  content,
  status = "COMPLETED",
  client_group_id,
}: {
  client_id: string;
  template_id: string;
  content: {
    appearance: string;
    dress: string;
    motor_activity: string;
    insight: string;
    judgement: string;
    affect: string;
    mood: string;
    orientation: string;
    memory: string;
    attention: string;
    thought_content: string;
    thought_process: string;
    perception: string;
    interview_behavior: string;
    speech: string;
    recommendations: string;
  };
  client_group_id?: string | null;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
}): Promise<[CreateSurveyAnswerResponse | null, Error | null]> => {
  return createSurveyAnswer({
    template_id,
    client_id,
    content,
    status,
    client_group_id,
  });
};
