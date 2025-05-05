import { FETCH } from "@mcw/utils";
import {
  Appointment,
  Client,
  ClientGroup,
  ClientGroupMembership,
  Invoice,
  Payment,
} from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

interface Location {
  id: string;
  name: string;
  address?: string;
  is_active?: boolean;
}

interface ClientGroupWithMembership extends ClientGroup {
  ClientGroupMembership: (ClientGroupMembership & { Client: Client })[];
}

interface PaginatedResponse<T> {
  data: T[];
  pagination:
    | {
        page: number;
        limit: number;
        total: number;
      }
    | null
    | ClientGroupWithMembership;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useFetchAppointments = (queryKey: any, searchParams: any) => {
  return useQuery({
    queryKey: queryKey,
    queryFn: () => fetchAppointments(searchParams),
  });
};

export const updateAppointment = async ({
  body = {},
  id,
}: {
  body: object;
  id: string;
}) => {
  try {
    const response: unknown = await FETCH.update({
      url: `/appointment/${id}`,
      body,
      isFormData: false,
    });

    return [response, null];
  } catch (error) {
    return [null, error];
  }
};

export const fetchInvoices = async ({ searchParams = {} }) => {
  try {
    const response = (await FETCH.get({
      url: "/invoice",
      searchParams,
    })) as Invoice[];

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

export const updateInvoice = async ({ body = {} }: { body: object }) => {
  try {
    const response: unknown = await FETCH.update({
      url: `/invoice`,
      body,
      isFormData: false,
      method: "PATCH",
    });

    return [response, null];
  } catch (error) {
    return [null, error];
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
}): Promise<
  [PaginatedResponse<Client> | ClientGroupWithMembership | null, Error | null]
> => {
  try {
    const response = (await FETCH.get({
      url: "/client/group",
      searchParams,
    })) as PaginatedResponse<Client> | ClientGroupWithMembership;

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

export const createInvoice = async ({
  body = {},
}): Promise<[Invoice | null, Error | null]> => {
  try {
    const response = (await FETCH.post({
      url: "/invoice",
      body,
      isFormData: false,
    })) as Invoice;

    return [response, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error("Unknown error")];
  }
};

export const fetchServices = async () => {
  try {
    const response: unknown = await FETCH.get({
      url: "/service",
    });

    return [response, null];
  } catch (error) {
    return [null, error];
  }
};
