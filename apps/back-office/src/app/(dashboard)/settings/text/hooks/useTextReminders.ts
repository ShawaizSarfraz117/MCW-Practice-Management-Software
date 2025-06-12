import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";

interface ReminderTextTemplate {
  id: string;
  type: string;
  content: string;
  reminderTime?: string;
}

export function useReminderTemplates() {
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery<ReminderTextTemplate[]>({
    queryKey: ["reminderTemplates"],
    queryFn: async () => {
      const response = await fetch("/api/reminder-text-templates");
      if (!response.ok) {
        throw new Error("Failed to fetch reminder templates");
      }
      return response.json();
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({
      type,
      content,
    }: {
      type: string;
      content: string;
    }) => {
      const response = await fetch(`/api/reminder-text-templates/${type}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update template");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminderTemplates"] });
      toast({
        title: "Success",
        description: "Text templates updated successfully",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update templates",
        variant: "destructive",
      });
    },
  });

  return {
    templates: templates || [],
    isLoading,
    updateTemplate: updateTemplateMutation.mutate,
    isUpdating: updateTemplateMutation.isPending,
  };
}
