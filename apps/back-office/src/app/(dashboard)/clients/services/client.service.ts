import { FETCH } from "@mcw/utils";

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
export const fetchClientGroups = async () => {
  try {
    const response: unknown = await FETCH.get({
      url: "/client/group",
    });

    return [response, null];
  } catch (error) {
    return [null, error];
  }
};
export const fetchLocations = async () => {
  try {
    const response: unknown = await FETCH.get({
      url: "/location",
    });

    return [response, null];
  } catch (error) {
    return [null, error];
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
