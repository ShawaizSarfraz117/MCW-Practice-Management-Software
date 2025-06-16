"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mcw/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { Button } from "@mcw/ui";
import { Label } from "@mcw/ui";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@mcw/ui";

interface AssignSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}

// Available survey templates
const SURVEY_TEMPLATES = [
  {
    id: "gad7",
    name: "GAD-7",
    description: "Generalized Anxiety Disorder 7-item scale",
  },
  {
    id: "phq9",
    name: "PHQ-9",
    description: "Patient Health Questionnaire 9-item scale",
  },
  {
    id: "arm5",
    name: "ARM-5",
    description: "Agnew Relationship Measure 5-item scale",
  },
];

export default function AssignSurveyDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: AssignSurveyDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Fetch survey templates from API
  const { mutate: assignSurvey, isPending } = useMutation({
    mutationFn: async (templateName: string) => {
      // First, get available templates from API
      const templatesResponse = await fetch("/api/survey-templates");
      if (!templatesResponse.ok) {
        throw new Error("Failed to fetch survey templates");
      }
      const templatesData = await templatesResponse.json();

      // Find the template by name
      interface SurveyTemplate {
        id: string;
        name: string;
        type: string;
        description: string;
      }

      const template = templatesData.data.find((t: SurveyTemplate) =>
        t.name.toLowerCase().includes(templateName.toLowerCase()),
      );

      if (!template) {
        throw new Error("Survey template not found");
      }

      // Create survey answer (assign to client)
      const response = await fetch("/api/survey-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: template.id,
          client_id: clientId,
          status: "PENDING",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign survey");
      }

      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
      setSelectedTemplate("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign survey",
        variant: "destructive",
      });
    },
  });

  const handleAssign = () => {
    if (!selectedTemplate) {
      toast({
        title: "Select a survey",
        description: "Please select a survey template to assign",
        variant: "destructive",
      });
      return;
    }
    assignSurvey(selectedTemplate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Survey</DialogTitle>
          <DialogDescription>
            Select a survey template to assign to this client.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="template">Survey Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="Select a survey template" />
              </SelectTrigger>
              <SelectContent>
                {SURVEY_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.name}>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-gray-500">
                        {template.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isPending}>
            {isPending ? "Assigning..." : "Assign Survey"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
