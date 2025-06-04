import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/api/client/contact/route";
import { createRequest } from "@mcw/utils";
// Mock dependencies
vi.mock("@mcw/database", () => ({
  prisma: {
    clientContact: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@mcw/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  config: {},
}));

// Import mocked modules
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

describe("Client Contact API - Unit Tests", () => {
  const mockClientId = "mock-client-id";
  const mockContactData = [
    {
      id: "contact-1",
      client_id: mockClientId,
      is_primary: true,
      permission: "ALLOWED",
      contact_type: "EMAIL",
      type: "PERSONAL",
      value: "test@example.com",
      ClientReminderPreference: [
        {
          id: "reminder-1",
          client_id: mockClientId,
          contact_id: "contact-1",
          reminder_type: "APPOINTMENT",
          channel: "EMAIL",
          is_enabled: true,
        },
      ],
    },
    {
      id: "contact-2",
      client_id: mockClientId,
      is_primary: false,
      permission: "ALLOWED",
      contact_type: "PHONE",
      type: "MOBILE",
      value: "123-456-7890",
      ClientReminderPreference: [
        {
          id: "reminder-2",
          client_id: mockClientId,
          contact_id: "contact-2",
          reminder_type: "CANCELLATION",
          channel: "SMS",
          is_enabled: true,
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if clientId is not provided", async () => {
    // Arrange
    const request = createRequest("/api/client/contact");

    // Act
    const response = await GET(request);
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(responseData.error).toBe("Client ID is required");
    expect(logger.info).not.toHaveBeenCalled();
    expect(prisma.clientContact.findMany).not.toHaveBeenCalled();
  });

  it("should return empty data when no contacts found", async () => {
    // Arrange
    const request = createRequest(
      `/api/client/contact?clientId=${mockClientId}`,
    );
    prisma.clientContact.findMany = vi.fn().mockResolvedValue([]);

    // Act
    const response = await GET(request);
    const responseData = await response.json();

    // Assert
    expect(prisma.clientContact.findMany).toHaveBeenCalledWith({
      where: { client_id: mockClientId },
      include: { ClientReminderPreference: true },
    });
    expect(response.status).toBe(200);
    expect(responseData.message).toBe("No contacts found for this client");
    expect(responseData.data).toEqual([]);
  });

  it("should return client contacts with their reminder preferences", async () => {
    // Arrange
    const request = createRequest(
      `/api/client/contact?clientId=${mockClientId}`,
    );
    prisma.clientContact.findMany = vi.fn().mockResolvedValue(mockContactData);

    // Act
    const response = await GET(request);
    const responseData = await response.json();

    // Assert
    expect(prisma.clientContact.findMany).toHaveBeenCalledWith({
      where: { client_id: mockClientId },
      include: { ClientReminderPreference: true },
    });
    expect(response.status).toBe(200);
    expect(responseData.data).toEqual(mockContactData);
  });

  it("should handle errors and return 500 status", async () => {
    // Arrange
    const request = createRequest(
      `/api/client/contact?clientId=${mockClientId}`,
    );
    const mockError = new Error("Database error");
    prisma.clientContact.findMany = vi.fn().mockRejectedValue(mockError);

    // Act
    const response = await GET(request);
    const responseData = await response.json();

    // Assert
    expect(prisma.clientContact.findMany).toHaveBeenCalledWith({
      where: { client_id: mockClientId },
      include: { ClientReminderPreference: true },
    });
    expect(logger.error).toHaveBeenCalledWith(
      { error: mockError },
      "Error fetching client contacts with reminder preferences",
    );
    expect(response.status).toBe(500);
    expect(responseData.error).toBe("Failed to fetch client contacts");
  });
});
