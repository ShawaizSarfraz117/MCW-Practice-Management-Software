import { FETCH } from "@mcw/utils";

interface PortalPermissionData {
  client_id: string;
  email: string;
  allow_appointment_requests: boolean;
  use_secure_messaging: boolean;
  access_billing_documents: boolean;
  receive_announcements: boolean;
  is_active: boolean;
}

interface InvitationData {
  subject?: string;
  message?: string;
  resend_email?: boolean;
}

export const fetchClientPortalPermission = async (clientId: string) => {
  try {
    const response = await FETCH.get({
      url: "/client/portal-permission",
      searchParams: { clientId },
    });
    return [response, null];
  } catch (error) {
    return [null, error];
  }
};

export const createClientPortalPermission = async (
  data: PortalPermissionData & InvitationData,
) => {
  try {
    const response = await FETCH.post({
      url: "/client/portal-permission",
      body: data,
    });
    return [response, null];
  } catch (error) {
    return [null, error];
  }
};

export const updateClientPortalPermission = async (
  data: PortalPermissionData & InvitationData,
) => {
  try {
    const response = await FETCH.update({
      url: "/client/portal-permission",
      body: data,
      method: "PUT",
    });
    return [response, null];
  } catch (error) {
    return [null, error];
  }
};

export const deleteClientPortalPermission = async (clientId: string) => {
  try {
    // Use native fetch for DELETE with query params since FETCH.remove doesn't support searchParams
    const response = await fetch(
      `/api/client/portal-permission?clientId=${clientId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }

    const data = await response.json();
    return [data, null];
  } catch (error) {
    return [null, error];
  }
};
