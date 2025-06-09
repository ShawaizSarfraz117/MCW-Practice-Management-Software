import { useMutation } from "@tanstack/react-query";
import { FETCH } from "@mcw/utils";
import { FileFrequency } from "@mcw/types";

interface ShareDocumentsPayload {
  client_group_id: string;
  clients: {
    client_id: string;
    file_ids?: string[];
    survey_template_ids?: string[];
    frequencies?: Record<string, FileFrequency>;
  }[];
}

export const useShareDocuments = () => {
  return useMutation({
    mutationFn: async (payload: ShareDocumentsPayload) => {
      const response = await FETCH.post({
        url: "client/share-file",
        body: payload,
      });
      return response;
    },
  });
};
