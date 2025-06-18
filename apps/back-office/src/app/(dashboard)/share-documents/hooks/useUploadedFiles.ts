import { useQuery } from "@tanstack/react-query";
import { FETCH } from "@mcw/utils";

interface UploadedFileFromAPI {
  id: string;
  title: string;
  url: string;
  type: string;
  uploadedAt: Date;
  uploadedBy: string | null;
  isShared: boolean;
  sharedAt: Date | null;
  sharingEnabled: boolean;
  status?: string;
}

interface UploadedFilesResponse {
  success: boolean;
  files: UploadedFileFromAPI[];
}

export const useUploadedFiles = (clientGroupId?: string) => {
  return useQuery({
    queryKey: ["uploaded-files", clientGroupId],
    queryFn: async () => {
      if (!clientGroupId) {
        return { success: true, files: [] };
      }

      const response = (await FETCH.get({
        url: `/client/files?client_group_id=${encodeURIComponent(clientGroupId)}`,
      })) as UploadedFilesResponse;

      return response;
    },
    enabled: !!clientGroupId,
  });
};
