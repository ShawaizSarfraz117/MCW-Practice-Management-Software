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
  method?: string;
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

    const promise = await fetch(`${ROUTES.BASE_URL}${newurl}`, {
      method: "GET",
      headers,
    });

    if (promise.status === 401) {
      await signOut();
      window.location.href = "/sign-in";
      return null;
    }

    if (!promise.ok) {
      let errorData;
      try {
        errorData = await promise.json();
      } catch {
        // If response is not JSON (like 404 from Next.js), create error object
        errorData = {
          error: {
            message: `Request failed: ${promise.status} ${promise.statusText} - ${method} ${url}`,
            status: promise.status,
          },
        };
      }
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
      let errorData;
      try {
        errorData = await promise.json();
      } catch {
        // If response is not JSON (like 404 from Next.js), create error object
        errorData = {
          error: {
            message: `Request failed: ${promise.status} ${promise.statusText} - ${method} ${url}`,
            status: promise.status,
          },
        };
      }
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
  method = "PUT",
}: FetchParams): Promise<ResponseData | null> => {
  try {
    const headers: AuthHeaders = {
      Accept: "application/json, text/plain, */*",
    };

    if (!isFormData) headers["Content-Type"] = "application/json";

    const fullUrl = id
      ? `${ROUTES.BASE_URL}/${url}/${id}`
      : `${ROUTES.BASE_URL}/${url}`;
    console.log(`Making ${method} request to: ${fullUrl}`);

    const promise = await fetch(fullUrl, {
      method: method,
      headers,
      body: isFormData ? (body as FormData) : JSON.stringify(body),
    });

    if (!promise.ok) {
      let errorData;
      try {
        errorData = await promise.json();
      } catch {
        // If response is not JSON (like 404 from Next.js), create error object
        errorData = {
          error: {
            message: `Request failed: ${promise.status} ${promise.statusText} - ${method} ${fullUrl}`,
            status: promise.status,
          },
        };
      }
      console.error(`API Request Failed:`, {
        url: fullUrl,
        status: promise.status,
        statusText: promise.statusText,
        errorData,
      });
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
