import { FETCH } from "@mcw/utils";
import { Appointment, Client, Invoice, Payment } from "@prisma/client";

interface Location {
  id: string;
  name: string;
  address?: string;
  is_active?: boolean;
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

export const fetchAppointments = async ({
  searchParams = {},
}): Promise<Appointment[] | Error> => {
  try {
    const response = (await FETCH.get({
      url: "/appointment",
      searchParams,
    })) as Appointment[];

    return response;
  } catch (error) {
    throw new Error(error as string);
  }
};

export const fetchInvoices = async ({
  searchParams = {},
}): Promise<[Invoice[] | null, Error | null | Invoice]> => {
  try {
    const response = (await FETCH.get({
      url: "/invoice",
      searchParams,
    })) as Invoice[];

    return [response as Invoice[], null];
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

export const fetchClientGroups = async ({
  searchParams = {},
}): Promise<[PaginatedResponse<Client> | null, Error | null]> => {
  try {
    const response = (await FETCH.get({
      url: "/client/group",
      searchParams,
    })) as PaginatedResponse<Client>;

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

export const createPayment = async ({
  body = {},
}): Promise<[Payment | null, Error | null]> => {
  try {
    const response = (await FETCH.post({
      url: "/invoice/payment",
      body,
      isFormData: false,
    })) as Payment;

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};
