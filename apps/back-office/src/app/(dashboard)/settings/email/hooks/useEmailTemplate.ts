import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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

interface ApiResponse<T> {
  data: T;
  error?: string;
}

export function useEmailTemplates() {
  const queryClient = useQueryClient();

  // UI state for section and template open/close
  const [openIndexes, setOpenIndexes] = useState<Set<string>>(new Set());
  const [openReminderIndexes, setOpenReminderIndexes] = useState<Set<string>>(
    new Set(),
  );
  const [openBillingIndexes, setOpenBillingIndexes] = useState<Set<string>>(
    new Set(),
  );
  const [isAutoSectionOpen, setIsAutoSectionOpen] = useState(true);
  const [isReminderSectionOpen, setIsReminderSectionOpen] = useState(true);
  const [isBillingSectionOpen, setIsBillingSectionOpen] = useState(true);

  // Fetch all templates
  const { data, isLoading, error } = useQuery<ApiResponse<EmailTemplate[]>>({
    queryKey: ["emailTemplates"],
    queryFn: async () => {
      const response = await fetch("/api/email-templates");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch templates");
      }
      return response.json();
    },
  });

  // Update a template by ID
  const updateMutation = useMutation({
    mutationFn: async ({
      templateId,
      formData,
    }: {
      templateId: string;
      formData: UpdateTemplateData;
    }) => {
      if (!templateId) {
        throw new Error("Template ID is required");
      }
      const response = await fetch(`/api/email-templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update template");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast({
        title: "Success",
        description: "Email template updated successfully",
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

  const reminderEmailTabs = [
    { label: "Client emails", value: "client" },
    { label: "Contact and couple emails", value: "contact" },
  ];

  return {
    templates: data?.data || [],
    isLoading,
    reminderEmailTabs,
    error: error as Error | null,
    updateTemplate: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    openIndexes,
    setOpenIndexes,
    openReminderIndexes,
    setOpenReminderIndexes,
    openBillingIndexes,
    setOpenBillingIndexes,
    isAutoSectionOpen,
    setIsAutoSectionOpen,
    isReminderSectionOpen,
    setIsReminderSectionOpen,
    isBillingSectionOpen,
    setIsBillingSectionOpen,
  };
}

export function useEmailTemplate(templateId: string | undefined) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<ApiResponse<EmailTemplate>>({
    queryKey: ["emailTemplate", templateId],
    queryFn: async () => {
      if (!templateId) {
        throw new Error("Template ID is required");
      }
      const response = await fetch(`/api/email-templates/${templateId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch template");
      }
      return response.json();
    },
    enabled: !!templateId,
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: UpdateTemplateData) => {
      if (!templateId) {
        throw new Error("Template ID is required");
      }
      const response = await fetch(`/api/email-templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update template");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["emailTemplate", templateId],
      });
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast({
        title: "Success",
        description: "Email template updated successfully",
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
    template: data?.data,
    isLoading,
    error: error as Error | null,
    updateTemplate: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
