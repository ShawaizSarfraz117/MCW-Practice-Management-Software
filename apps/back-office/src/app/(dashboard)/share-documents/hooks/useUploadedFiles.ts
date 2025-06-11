import { useQuery } from "@tanstack/react-query";
import { FETCH } from "@mcw/utils";
import { UploadedFile } from "@mcw/types";

interface UploadedFilesResponse {
  success: boolean;
  files: UploadedFile[];
}

export const useUploadedFiles = (clientGroupId?: string) => {
  return useQuery({
    queryKey: ["uploaded-files", clientGroupId],
    queryFn: async () => {
      if (!clientGroupId) {
        return { success: true, files: [] };
      }

      const response = (await FETCH.get({
        url: `/client/files/upload?client_group_id=${clientGroupId}`,
      })) as UploadedFilesResponse;

      return response;
    },
    enabled: !!clientGroupId,
  });
};
