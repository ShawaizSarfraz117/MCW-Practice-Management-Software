import { signOut } from "next-auth/react";

const ROUTES = {
  BASE_URL: `/api`,
};

type SearchParams = Record<string, string | number | boolean | undefined>;
type AuthHeaders = {
  Authorization?: string;
  Accept: string;
  "Content-Type"?: string;
  "Accept-Encoding"?: string;
};

interface TypedFetchParams<TBody = unknown> {
  url: string;
  id?: string | number | null;
  searchParams?: SearchParams | null;
  auth?: boolean;
  token?: string | null;
  body?: TBody;
  isFormData?: boolean;
  method?: string;
}

class TypedFetch {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      await signOut({ redirect: true });
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async get<TResponse>({
    url,
    searchParams = null,
    id = null,
  }: Omit<
    TypedFetchParams,
    "body" | "isFormData" | "method"
  >): Promise<TResponse> {
    const headers: AuthHeaders = {
      Accept: "application/json",
    };

    let newurl = url;
    if (id) {
      newurl = newurl + "/" + id;
    } else if (searchParams && Object.keys(searchParams).length > 0) {
      // Filter out undefined values
      const filteredParams = Object.entries(searchParams).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = String(value);
          }
          return acc;
        },
        {} as Record<string, string>,
      );

      const queryParams = new URLSearchParams(filteredParams).toString();
      if (queryParams) {
        newurl = `${newurl}?${queryParams}`;
      }
    }

    const response = await fetch(`${ROUTES.BASE_URL}${newurl}`, {
      method: "GET",
      headers,
    });

    return this.handleResponse<TResponse>(response);
  }

  async post<TBody = unknown, TResponse = unknown>({
    url,
    body,
    isFormData = false,
  }: Pick<
    TypedFetchParams<TBody>,
    "url" | "body" | "isFormData"
  >): Promise<TResponse> {
    const headers: AuthHeaders = {
      Accept: "application/json, text/plain, */*",
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${ROUTES.BASE_URL}/${url}`, {
      method: "POST",
      headers,
      body: isFormData ? (body as FormData) : JSON.stringify(body),
    });

    return this.handleResponse<TResponse>(response);
  }

  async put<TBody = unknown, TResponse = unknown>({
    url,
    id = null,
    body = {} as TBody,
    isFormData = false,
  }: Pick<
    TypedFetchParams<TBody>,
    "url" | "id" | "body" | "isFormData"
  >): Promise<TResponse> {
    const headers: AuthHeaders = {
      Accept: "application/json, text/plain, */*",
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    let newurl = url;
    if (id) {
      newurl = newurl + "/" + id;
    }

    const response = await fetch(`${ROUTES.BASE_URL}/${newurl}`, {
      method: "PUT",
      headers,
      body: isFormData ? (body as FormData) : JSON.stringify(body),
    });

    return this.handleResponse<TResponse>(response);
  }

  async patch<TBody = unknown, TResponse = unknown>({
    url,
    id = null,
    body = {} as TBody,
    isFormData = false,
  }: Pick<
    TypedFetchParams<TBody>,
    "url" | "id" | "body" | "isFormData"
  >): Promise<TResponse> {
    const headers: AuthHeaders = {
      Accept: "application/json, text/plain, */*",
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    let newurl = url;
    if (id) {
      newurl = newurl + "/" + id;
    }

    const response = await fetch(`${ROUTES.BASE_URL}/${newurl}`, {
      method: "PATCH",
      headers,
      body: isFormData ? (body as FormData) : JSON.stringify(body),
    });

    return this.handleResponse<TResponse>(response);
  }

  async delete<TResponse = unknown>({
    url,
    id = null,
  }: Pick<TypedFetchParams, "url" | "id">): Promise<TResponse> {
    const headers: AuthHeaders = {
      Accept: "application/json",
    };

    let newurl = url;
    if (id) {
      newurl = newurl + "/" + id;
    }

    const response = await fetch(`${ROUTES.BASE_URL}/${newurl}`, {
      method: "DELETE",
      headers,
    });

    return this.handleResponse<TResponse>(response);
  }
}

export const typedFetch = new TypedFetch();
