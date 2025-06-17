import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SurveyAnswerResponse } from "@/types/survey-answer";
import { useToast } from "@mcw/ui";

const SURVEY_ANSWER_KEY = "survey-answer";

export function useSurveyAnswer(surveyAnswerId: string) {
  return useQuery<SurveyAnswerResponse>({
    queryKey: [SURVEY_ANSWER_KEY, surveyAnswerId],
    queryFn: async () => {
      const response = await fetch(`/api/survey-answers/${surveyAnswerId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch survey answer");
      }
      return response.json();
    },
    enabled: !!surveyAnswerId,
  });
}

export function useUpdateSurveyAnswer(surveyAnswerId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      status?: string;
      content?: Record<string, string>;
    }) => {
      const response = await fetch(`/api/survey-answers/${surveyAnswerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update survey answer");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [SURVEY_ANSWER_KEY, surveyAnswerId],
      });
      toast({
        title: "Success",
        description: "Survey answer updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSurveyAnswer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (surveyAnswerId: string) => {
      const response = await fetch(`/api/survey-answers/${surveyAnswerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete survey answer");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SURVEY_ANSWER_KEY] });
      toast({
        title: "Success",
        description: "Survey answer deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
