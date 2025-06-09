import { FETCH } from "@mcw/utils";

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
