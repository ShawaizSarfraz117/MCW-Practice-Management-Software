import { FETCH } from "@mcw/utils";
import { useQuery } from "@tanstack/react-query";

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

export const updateChartNote = async ({
  body = {},
  id,
}: {
  body: object;
  id: string;
}) => {
  try {
    const response: unknown = await FETCH.update({
      url: `/client/group/chart-notes/${id}`,
      body,
      isFormData: false,
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
