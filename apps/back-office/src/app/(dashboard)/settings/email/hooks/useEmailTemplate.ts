import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface UpdateTemplateData {
  name: string;
  subject: string;
  content: string;
  type: string;
  isActive?: boolean;
}

export function useEmailTemplates() {
  const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["emailTemplates"],
    queryFn: async () => {
      const response = await fetch("/api/email-templates");
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      return response.json();
    },
  });

  return {
    templates,
    isLoading,
  };
}

export function useEmailTemplate(templateId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: template, isLoading } = useQuery<EmailTemplate>({
    queryKey: ["emailTemplate", templateId],
    queryFn: async () => {
      if (!templateId) {
        throw new Error("Template ID is required");
      }
      const response = await fetch(`/api/email-templates/${templateId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch template");
      }
      return response.json();
    },
    enabled: !!templateId, // Only run the query if templateId exists
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateTemplateData) => {
      if (!templateId) {
        throw new Error("Template ID is required");
      }
      const response = await fetch(`/api/email-templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update template");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["emailTemplate", templateId],
      });
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast({
        title: "Template updated",
        description: "The email template has been updated successfully.",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    },
  });

  return {
    template,
    isLoading,
    updateTemplate: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
