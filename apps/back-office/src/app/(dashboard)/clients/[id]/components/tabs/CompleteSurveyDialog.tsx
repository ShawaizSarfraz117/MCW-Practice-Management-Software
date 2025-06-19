"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mcw/ui";
import { Button } from "@mcw/ui";
import { Card, CardContent } from "@mcw/ui";
import { Badge } from "@mcw/ui";
import { Alert, AlertDescription } from "@mcw/ui";
import { AlertCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@mcw/ui";
import { Survey } from "survey-react-ui";
import { Model } from "survey-core";

interface SurveyScore {
  totalScore: number;
  severity?: string;
  interpretation?: string;
  flaggedItems?: string[];
}

interface SurveyAnswer {
  id: string;
  template_id: string;
  client_id: string;
  content?: Record<string, unknown>;
  score?: SurveyScore;
  status: string;
  SurveyTemplate: {
    id: string;
    name: string;
    type: string;
    description: string;
  };
}

interface CompleteSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyAnswer: SurveyAnswer;
  onSuccess: () => void;
}

export default function CompleteSurveyDialog({
  open,
  onOpenChange,
  surveyAnswer,
  onSuccess,
}: CompleteSurveyDialogProps) {
  const [surveyModel, setSurveyModel] = useState<Model | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, unknown>>(
    {},
  );

  // Fetch full survey answer with template content
  const { data: fullSurveyAnswer, isLoading } = useQuery({
    queryKey: ["surveyAnswer", surveyAnswer.id],
    queryFn: async () => {
      const response = await fetch(`/api/survey-answers/${surveyAnswer.id}`);
      if (!response.ok) throw new Error("Failed to fetch survey answer");
      return response.json();
    },
    enabled: open,
  });

  // Initialize survey model when data is loaded
  useEffect(() => {
    if (fullSurveyAnswer?.SurveyTemplate?.content) {
      const model = new Model(fullSurveyAnswer.SurveyTemplate.content);

      // If there's existing content (in progress), load it
      if (fullSurveyAnswer.content) {
        model.data = fullSurveyAnswer.content;
        setCurrentAnswers(fullSurveyAnswer.content);
      }

      // Configure survey settings
      model.showProgressBar = "top";
      model.progressBarType = "pages";
      model.showQuestionNumbers = "on";
      model.completeText = "Submit";

      // Track changes
      model.onValueChanged.add((sender) => {
        setCurrentAnswers(sender.data);
      });

      setSurveyModel(model);
    }
  }, [fullSurveyAnswer]);

  // Save progress mutation
  const { mutate: saveProgress } = useMutation({
    mutationFn: async (data: {
      content: Record<string, unknown>;
      status: string;
    }) => {
      const response = await fetch(`/api/survey-answers/${surveyAnswer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save survey");
      }

      return response.json();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save survey progress",
        variant: "destructive",
      });
    },
  });

  // Complete survey mutation
  const { mutate: completeSurvey, isPending: isCompleting } = useMutation({
    mutationFn: async (content: Record<string, unknown>) => {
      const response = await fetch(`/api/survey-answers/${surveyAnswer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          status: "COMPLETED",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to complete survey");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Check for flagged items (e.g., suicidal ideation)
      if (data.score?.flaggedItems?.length > 0) {
        toast({
          title: "⚠️ Clinical Alert",
          description: data.score.flaggedItems[0],
          variant: "destructive",
        });
      }

      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete survey",
        variant: "destructive",
      });
    },
  });

  const handleSaveProgress = () => {
    if (surveyModel) {
      saveProgress({
        content: surveyModel.data,
        status: "IN_PROGRESS",
      });
      toast({
        title: "Progress saved",
        description: "Your survey progress has been saved.",
      });
    }
  };

  // handleComplete function removed - using onComplete callback instead

  const handleSurveyComplete = (sender: Model) => {
    // This is called when the survey's complete button is clicked
    completeSurvey(sender.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{surveyAnswer.SurveyTemplate.name}</DialogTitle>
          <DialogDescription>
            {surveyAnswer.SurveyTemplate.description}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">
            Loading survey...
          </div>
        ) : surveyModel ? (
          <div className="py-4">
            <Survey model={surveyModel} onComplete={handleSurveyComplete} />

            {/* Show warning for PHQ-9 if suicidal ideation is indicated */}
            {surveyAnswer.SurveyTemplate.name.includes("PHQ-9") &&
            currentAnswers &&
            currentAnswers.phq9_q10 &&
            currentAnswers.phq9_q10 !== "Item 1" ? (
              <Alert className="mt-4 border-red-500 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Clinical Alert:</strong> Client has indicated thoughts
                  of self-harm. Immediate clinical attention and safety
                  assessment required.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            Unable to load survey template.
          </div>
        )}

        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              disabled={isCompleting}
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            {surveyAnswer.status !== "COMPLETED" && (
              <Button
                disabled={isCompleting || !surveyModel}
                variant="outline"
                onClick={handleSaveProgress}
              >
                Save Progress
              </Button>
            )}
          </div>
          {surveyAnswer.status === "COMPLETED" && fullSurveyAnswer?.score && (
            <Card className="ml-auto">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Score:</span>
                  <span className="font-medium">
                    {fullSurveyAnswer.score.totalScore}
                  </span>
                  {fullSurveyAnswer.score.severity && (
                    <Badge variant="outline">
                      {fullSurveyAnswer.score.severity}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
