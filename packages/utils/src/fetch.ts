import { signOut } from "next-auth/react";

const ROUTES = {
  BASE_URL: `/api`,
};

type SearchParams = Record<string, string | number | boolean>;
type AuthHeaders = {
  Authorization?: string;
  Accept: string;
  "Content-Type"?: string;
  "Accept-Encoding"?: string;
};

// Define a more specific response type that can be extended where needed
type ResponseData<T = unknown> = T;

interface FetchParams {
  url: string;
  id?: string | number | null;
  searchParams?: SearchParams | null;
  auth?: boolean;
  token?: string | null;
  body?: unknown;
  isFormData?: boolean;
}

const get = async ({
  url,
  searchParams = null,
  id = null,
}: FetchParams): Promise<ResponseData | null> => {
  try {
    const headers: AuthHeaders = {
      Accept: "",
    };
    let newurl = url;

    if (id) newurl = newurl + "/" + id;
    else if (searchParams && Object.keys(searchParams).length > 0) {
      const queryParams = new URLSearchParams(
        searchParams as Record<string, string>,
      ).toString();
      newurl = `${newurl}?${queryParams}`;
    }

    const promise = await fetch(`${ROUTES.BASE_URL}/${newurl}`, {
      method: "GET",
      headers,
    });

    if (promise.status === 401) {
      await signOut();
      window.location.href = "/sign-in";
      return null;
    }

    if (!promise.ok) {
      const errorData = await promise.json();
      return Promise.reject(errorData);
    }

    if (promise.status === 200) {
      const res = await promise.json();
      return res;
    } else return null;
  } catch (error) {
    console.log("GET ", error);
    return null;
  }
};

const post = async ({
  url,
  body,
  isFormData = false,
}: FetchParams): Promise<ResponseData | null> => {
  try {
    const headers: AuthHeaders = {
      Accept: "application/json, text/plain, */*",
    };

    if (!isFormData) headers["Content-Type"] = "application/json";

    const promise = await fetch(`${ROUTES.BASE_URL}/${url}`, {
      method: "POST",
      headers,
      body: isFormData ? (body as FormData) : JSON.stringify(body),
    });

    if (!promise.ok) {
      const errorData = await promise.json();
      return Promise.reject(errorData);
    }

    const data = await promise.json();
    return data;
  } catch (ex: unknown) {
    if (ex instanceof TypeError && ex.message === "Failed to fetch") {
      throw new Error("Network Error: Please check your internet connection");
    }

    if (ex instanceof Error) {
      throw ex;
    }

    throw new Error("An unknown error occurred");
  }
};

const update = async ({
  url,
  id = null,
  body = {},
  isFormData = false,
}: FetchParams): Promise<ResponseData | null> => {
  try {
    const headers: AuthHeaders = {
      Accept: "application/json, text/plain, */*",
    };

    if (!isFormData) headers["Content-Type"] = "application/json";

    const promise = await fetch(
      id ? `${ROUTES.BASE_URL}/${url}/${id}` : `${ROUTES.BASE_URL}/${url}`,
      {
        method: "PUT",
        headers,
        body: isFormData ? (body as FormData) : JSON.stringify(body),
      },
    );

    if (!promise.ok) {
      const errorData = await promise.json();
      return Promise.reject(errorData);
    }

    if (promise.status === 200) {
      const res = await promise.json();
      return res;
    } else return null;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred");
  }
};

const FETCH = { get, post, update };

export { FETCH, ROUTES };
