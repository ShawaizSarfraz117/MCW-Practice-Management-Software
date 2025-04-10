import { FETCH } from "@mcw/utils";
import { Client } from "@prisma/client";

interface Location {
  id: string;
  name: string;
  address?: string;
  is_active?: boolean;
}

interface ClientGroup {
  id: string;
  type: string;
  name: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export const fetchClients = async ({
  searchParams = {},
}): Promise<[PaginatedResponse<Client> | null, Error | null]> => {
  try {
    const response = (await FETCH.get({
      url: "/client",
      searchParams,
    })) as PaginatedResponse<Client>;

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

export const createClient = async ({ body = {} }) => {
  try {
    const response: unknown = await FETCH.post({
      url: "/client",
      body,
      isFormData: false,
    });

    return [response, null];
  } catch (error) {
    return [null, error];
  }
};

export const fetchClientGroups = async (): Promise<
  [ClientGroup[] | null, Error | null]
> => {
  try {
    const response = (await FETCH.get({
      url: "/client/group",
    })) as ClientGroup[];

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};
export const fetchLocations = async (): Promise<
  [Location[] | null, Error | null]
> => {
  try {
    const response = (await FETCH.get({
      url: "/location",
    })) as Location[];

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};
export const fetchClinicians = async () => {
  try {
    const response: unknown = await FETCH.get({
      url: "/clinician",
    });

    return [response, null];
  } catch (error) {
    return [null, error];
  }
};
