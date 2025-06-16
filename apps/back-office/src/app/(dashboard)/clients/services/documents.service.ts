import { FETCH } from "@mcw/utils";
import { useQuery } from "@tanstack/react-query";
import { DocumentType } from "@mcw/types";

export const fetchSingleStatement = async ({ searchParams = {} }) => {
  try {
    const response: unknown = await FETCH.get({
      url: "/statement",
      searchParams,
    });

    return [response, null];
  } catch (error) {
    return [null, error];
  }
};

export const createStatement = async ({ body = {} }) => {
  try {
    const response: unknown = await FETCH.post({
      url: "/statement",
      body: body,
    });

    return [response, null];
  } catch (error) {
    return [null, error];
  }
};

export const fetchSingleSuperbill = async ({ searchParams = {} }) => {
  try {
    const response: unknown = await FETCH.get({
      url: "/superbill",
      searchParams,
    });

    return [response, null];
  } catch (error) {
    return [null, error];
  }
};

export const createSuperbill = async ({ body = {} }) => {
  try {
    const response: unknown = await FETCH.post({
      url: "/superbill",
      body: body,
    });
    return [response, null];
  } catch (error) {
    return [null, error];
  }
};

export const createChartNote = async ({ body = {} }) => {
  try {
    const response: unknown = await FETCH.post({
      url: "/client/group/chart-notes",
      body: body,
    });
    return [response, null];
  } catch (error) {
    return [null, error];
  }
};

export const deleteChartNote = async ({ id }: { id: string }) => {
  try {
    const response: unknown = await FETCH.remove({
      url: `/client/group/chart-notes/${id}`,
    });

    return [response, null];
  } catch (error) {
    return [null, error];
  }
};

export const useFetchStatement = (statementId: string | null) => {
  return useQuery({
    queryKey: ["statement", statementId],
    queryFn: async () => {
      if (!statementId) return null;

      const [response, error] = await fetchSingleStatement({
        searchParams: { id: statementId },
      });

      if (error) {
        throw new Error("Failed to load statement");
      }

      return response;
    },
    enabled: !!statementId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const deleteDocument = async (
  documentId: string,
  documentType: DocumentType,
) => {
  const response = await fetch(
    `/api/client/overview?documentId=${documentId}&documentType=${documentType}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete document");
  }

  return response.json();
};

export const updateChartNote = async (
  chartNoteId: string,
  data: { text?: string; note_date?: string },
) => {
  const response = await fetch(`/api/client/group/chart-notes/${chartNoteId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update chart note");
  }

  return response.json();
};
