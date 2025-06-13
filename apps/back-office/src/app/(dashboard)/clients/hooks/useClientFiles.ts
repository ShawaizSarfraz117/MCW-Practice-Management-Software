import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";
import {
  ClientFile,
  ClientFileResponse,
  FILE_STATUS_COLORS,
  FileStatus,
} from "@mcw/types";
import { showErrorToast } from "@mcw/utils";

const transformClientFileData = (
  file: ClientFileResponse & { clientName?: string; clientInitials?: string },
): ClientFile => {
  const fileType = file.ClientGroupFile.type || "Document";
  const status = (file.status as FileStatus) || "Pending";

  let finalStatus: FileStatus = status;
  if (file.completed_at || file.SurveyAnswers?.submitted_at) {
    finalStatus = "Completed JA";
  } else if (file.status === "Completed") {
    finalStatus = "Completed";
  }

  const updatedDate =
    file.ClientGroupFile.updated_at ||
    file.shared_at ||
    new Date().toISOString();
  const formattedDate = new Date(updatedDate).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });

  return {
    id: file.id,
    name: file.ClientGroupFile.title,
    type: fileType,
    status: finalStatus,
    statusColor: FILE_STATUS_COLORS[finalStatus] || "text-gray-600",
    updated: formattedDate,
    nameColor: "text-blue-500",
    url: file.ClientGroupFile.url,
    clientGroupFileId: file.client_group_file_id,
    frequency: file.frequency,
    nextDueDate: file.next_due_date ? new Date(file.next_due_date) : null,
    surveyAnswersId: file.survey_answers_id,
    clientName: file.clientName,
    clientInitials: file.clientInitials,
    clientId: file.client_id,
  };
};

export const useClientFiles = (clientId: string) => {
  return useQuery({
    queryKey: ["clientFiles", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/client/files?client_id=${clientId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch client files");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error("Invalid response format");
      }

      const allFiles: ClientFile[] = [];

      if (data.practiceUploads) {
        data.practiceUploads.forEach((file: ClientFileResponse["ClientGroupFile"]) => {
          const formattedDate = new Date(file.created_at).toLocaleDateString(
            "en-US",
            {
              month: "numeric",
              day: "numeric",
              year: "2-digit",
            },
          );

          allFiles.push({
            id: file.id,
            name: file.title,
            type: file.type,
            status: "Uploaded" as FileStatus,
            statusColor: FILE_STATUS_COLORS["Uploaded"] || "text-gray-600",
            updated: formattedDate,
            nameColor: "text-blue-500",
            url: file.url,
            clientGroupFileId: file.id,
            frequency: null,
            nextDueDate: null,
            surveyAnswersId: null,
            isPracticeUpload: true,
          });
        });
      }

      // Add shared files
      if (data.sharedFiles) {
        data.sharedFiles.forEach((file: ClientFileResponse) => {
          allFiles.push({
            ...transformClientFileData(file),
            isPracticeUpload: false,
          });
        });
      }

      return allFiles;
    },
    enabled: !!clientId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useUploadClientFile = (
  clientId: string,
  clientGroupId: string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, title }: { file: File; title?: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_id", clientId);
      formData.append("client_group_id", clientGroupId);
      if (title) {
        formData.append("title", title);
      }

      const response = await fetch("/api/client/files", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload file");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate both individual client files and group files
      queryClient.invalidateQueries({ queryKey: ["clientFiles", clientId] });
      queryClient.invalidateQueries({
        queryKey: ["clientGroupFiles", clientGroupId],
      });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });
};

export const useUploadFileToClient = (
  clientGroupId: string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, title, clientId }: { file: File; title?: string; clientId: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_id", clientId);
      formData.append("client_group_id", clientGroupId);
      if (title) {
        formData.append("title", title);
      }

      const response = await fetch("/api/client/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload file");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate group files
      queryClient.invalidateQueries({
        queryKey: ["clientGroupFiles", clientGroupId],
      });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });
};

export const useShareFileWithClient = (clientId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientGroupId,
      fileId,
    }: {
      clientGroupId: string;
      fileId: string;
    }) => {
      const response = await fetch("/api/client/share-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_group_id: clientGroupId,
          clients: [
            {
              client_id: clientId,
              file_ids: [fileId],
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to share file");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientFiles", clientId] });
      toast({
        title: "Success",
        description: "File shared with client successfully",
      });
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });
};

export const useDeleteClientFile = (
  clientId: string,
  clientGroupId?: string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/client/files/${fileId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete file");
      }

      // Check if confirmation is required (practice upload with shares)
      if (data.requiresConfirmation) {
        // Automatically confirm deletion
        const confirmResponse = await fetch(`/api/client/files/${fileId}/confirm-delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ confirmDelete: true }),
        });

        const confirmData = await confirmResponse.json();

        if (!confirmResponse.ok) {
          throw new Error(confirmData.error || "Failed to delete file");
        }

        return confirmData;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clientFiles", clientId] });
      if (clientGroupId) {
        queryClient.invalidateQueries({
          queryKey: ["clientGroupFiles", clientGroupId],
        });
      }
      toast({
        title: "Success",
        description: data.message || "File deleted successfully",
      });
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });
};

// Hook for downloading files with SAS token
export const useDownloadFile = () => {
  return useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/client/files/${fileId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get download URL");
      }

      const data = await response.json();
      
      if (data.downloadUrl) {
        // Open the SAS URL in a new tab
        window.open(data.downloadUrl, "_blank");
        return data;
      } else {
        throw new Error("No download URL received");
      }
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });
};

export const useConfirmDeleteClientFile = (
  clientId: string,
  clientGroupId?: string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(
        `/api/client/files/${fileId}/confirm-delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ confirmDelete: true }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete file");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clientFiles", clientId] });
      if (clientGroupId) {
        queryClient.invalidateQueries({
          queryKey: ["clientGroupFiles", clientGroupId],
        });
      }
      toast({
        title: "Success",
        description: data.message || "File and all shares deleted successfully",
      });
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });
};

// Hook to fetch files for all clients in a group
export const useClientGroupFiles = (
  clientGroupId: string,
  clients: Array<{ id: string; name: string }>,
) => {
  return useQuery({
    queryKey: ["clientGroupFiles", clientGroupId, clients.map((c) => c.id)],
    queryFn: async () => {
      const allFiles: ClientFile[] = [];

      // First, fetch practice uploads for the group (only once, not per client)
      const practiceResponse = await fetch(
        `/api/client/files?client_group_id=${clientGroupId}`,
      );
      if (practiceResponse.ok) {
        const practiceData = await practiceResponse.json();

        if (practiceData.success && practiceData.files) {
          // These are practice uploads - no client initials
          practiceData.files.forEach((file: ClientFileResponse["ClientGroupFile"]) => {
            allFiles.push({
              id: file.id,
              name: file.title,
              type: file.type || "Practice Upload",
              status: "Uploaded" as FileStatus,
              statusColor: FILE_STATUS_COLORS["Uploaded"] || "text-gray-600",
              updated: new Date(
                file.created_at,
              ).toLocaleDateString("en-US", {
                month: "numeric",
                day: "numeric",
                year: "2-digit",
              }),
              nameColor: "text-blue-500",
              url: file.url,
              clientGroupFileId: file.id,
              frequency: null,
              nextDueDate: null,
              surveyAnswersId: null,
              isPracticeUpload: true,
              clientName: undefined,
              clientInitials: undefined, // No initials for practice uploads
              clientId: undefined,
            });
          });
        }
      }

      // Then fetch shared files for each client
      const clientFilesPromises = clients.map(async (client) => {
        const response = await fetch(
          `/api/client/files?client_id=${client.id}`,
        );

        if (!response.ok) {
          console.error(`Failed to fetch files for client ${client.id}`);
          return [];
        }

        const data = await response.json();

        if (!data.success || !data.sharedFiles) {
          return [];
        }

        const clientInitials = client.name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        // Only process shared files (not practice uploads) for each client
        return data.sharedFiles.map((file: ClientFileResponse) => ({
          ...transformClientFileData({
            ...file,
            clientName: client.name,
            clientInitials: clientInitials,
          }),
          isPracticeUpload: false,
        }));
      });

      const clientSharedFiles = await Promise.all(clientFilesPromises);

      // Combine practice uploads with all client shared files
      return [...allFiles, ...clientSharedFiles.flat()];
    },
    enabled: !!clientGroupId && clients.length > 0,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
