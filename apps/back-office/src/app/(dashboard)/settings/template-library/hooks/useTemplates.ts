import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TemplateType } from "@/types/templateTypes";

export interface Template {
  id: string;
  name: string;
  content: string;
  type: TemplateType;
  description: string | null;
  frequency_options: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  requires_signature: boolean;
  is_shareable: boolean;
}

// Fetch all templates
export function useTemplates(filters?: {
  type?: TemplateType;
  is_active?: boolean;
  search?: string;
  sharable?: boolean;
}) {
  const queryParams = new URLSearchParams();

  if (filters?.type) {
    queryParams.append("type", filters.type);
  }

  if (filters?.is_active !== undefined) {
    queryParams.append("is_active", filters.is_active.toString());
  }

  if (filters?.sharable !== undefined) {
    queryParams.append("sharable", filters.sharable.toString());
  }

  if (filters?.search) {
    queryParams.append("search", filters.search);
  }

  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : "";

  return useQuery({
    queryKey: ["templates", filters],
    queryFn: async () => {
      const response = await fetch(`/api/templates${queryString}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch templates");
      }
      return response.json();
    },
  });
}

// Fetch a single template by ID
export function useTemplate(id: string) {
  return useQuery({
    queryKey: ["template", id],
    queryFn: async () => {
      const response = await fetch(`/api/templates/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch template");
      }
      return response.json();
    },
    enabled: !!id,
  });
}

// Create a new template
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      template: Omit<Template, "id" | "created_at" | "updated_at">,
    ) => {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create template");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Template created successfully");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create template");
    },
  });
}

// Update an existing template
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Template> & { id: string }) => {
      const response = await fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update template");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      toast.success("Template updated successfully");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["template", variables.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update template");
    },
  });
}

// Delete a template
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/templates?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete template");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Template deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete template");
    },
  });
}

// Duplicate a template
export function useDuplicateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Template) => {
      // Create a new template based on the existing one
      const newTemplate = {
        name: `${template.name} (Copy)`,
        content: template.content,
        type: template.type,
        description: template.description,
        is_active: template.is_active,
        is_default: false, // Never copy default status
        requires_signature: template.requires_signature,
        is_shareable: template.is_shareable,
        frequency_options: template.frequency_options,
      };

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTemplate),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to duplicate template");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Template duplicated successfully");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to duplicate template");
    },
  });
}
