import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET } from "../../../../src/app/api/client/contact/route";
import { prisma } from "@mcw/database";
import { generateUUID } from "@mcw/utils";
import { NextRequest } from "next/server";

// Helper function to create NextRequest
function createRequest(url: string): NextRequest {
  return new NextRequest(`http://localhost${url}`);
}

// Define test data types
interface TestData {
  clientId: string;
  contactIds: string[];
  reminderPreferenceIds: string[];
}

// Define contact interface for type safety
interface Contact {
  id: string;
  client_id: string;
  is_primary: boolean;
  permission: string;
  contact_type: string;
  type: string;
  value: string;
  ClientReminderPreference: Array<{
    id: string;
    client_id: string;
    contact_id: string;
    reminder_type: string;
    channel: string;
    is_enabled: boolean;
  }>;
}

describe("Client Contact API - Integration Tests", () => {
  const testData: TestData = {
    clientId: "",
    contactIds: [],
    reminderPreferenceIds: [],
  };

  // Setup test data
  beforeAll(async () => {
    // Create a test client
    const client = await prisma.client.create({
      data: {
        id: generateUUID(),
        legal_first_name: "Contact",
        legal_last_name: "Test",
        is_active: true,
        is_waitlist: false,
      },
    });
    testData.clientId = client.id;

    // Create test contacts
    const emailContact = await prisma.clientContact.create({
      data: {
        id: generateUUID(),
        client_id: client.id,
        is_primary: true,
        permission: "ALLOWED",
        contact_type: "EMAIL",
        type: "PERSONAL",
        value: "test-email@example.com",
      },
    });
    testData.contactIds.push(emailContact.id);

    const phoneContact = await prisma.clientContact.create({
      data: {
        id: generateUUID(),
        client_id: client.id,
        is_primary: false,
        permission: "ALLOWED",
        contact_type: "PHONE",
        type: "MOBILE",
        value: "555-123-4567",
      },
    });
    testData.contactIds.push(phoneContact.id);

    // Create reminder preferences
    const emailReminder = await prisma.clientReminderPreference.create({
      data: {
        id: generateUUID(),
        client_id: client.id,
        contact_id: emailContact.id,
        reminder_type: "APPOINTMENT",
        channel: "EMAIL",
        is_enabled: true,
      },
    });
    testData.reminderPreferenceIds.push(emailReminder.id);

    const textReminder = await prisma.clientReminderPreference.create({
      data: {
        id: generateUUID(),
        client_id: client.id,
        contact_id: phoneContact.id,
        reminder_type: "CANCELLATION",
        channel: "SMS",
        is_enabled: true,
      },
    });
    testData.reminderPreferenceIds.push(textReminder.id);
  });

  // Clean up test data
  afterAll(async () => {
    // Clean up in reverse order
    // Delete reminder preferences
    for (const id of testData.reminderPreferenceIds) {
      await prisma.clientReminderPreference
        .delete({
          where: { id },
        })
        .catch(() => {
          // Ignore errors if already deleted
        });
    }

    // Delete contacts
    for (const id of testData.contactIds) {
      await prisma.clientContact
        .delete({
          where: { id },
        })
        .catch(() => {
          // Ignore errors if already deleted
        });
    }

    // Delete client
    if (testData.clientId) {
      await prisma.client
        .delete({
          where: { id: testData.clientId },
        })
        .catch(() => {
          // Ignore errors if already deleted
        });
    }
  });

  it("GET /api/client/contact should return 400 if clientId is not provided", async () => {
    // Arrange
    const request = createRequest("/api/client/contact");

    // Act
    const response = await GET(request);
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(responseData.error).toBe("Client ID is required");
  });

  it("GET /api/client/contact should return empty data for non-existent client", async () => {
    // Arrange
    const nonExistentId = generateUUID();
    const request = createRequest(
      `/api/client/contact?clientId=${nonExistentId}`,
    );

    // Act
    const response = await GET(request);
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseData.message).toBe("No contacts found for this client");
    expect(responseData.data).toEqual([]);
  });

  it("GET /api/client/contact should return client contacts with reminder preferences", async () => {
    // Arrange
    const request = createRequest(
      `/api/client/contact?clientId=${testData.clientId}`,
    );

    // Act
    const response = await GET(request);
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseData.data).toBeInstanceOf(Array);
    expect(responseData.data.length).toBe(2);

    // Check that we got both contacts
    const contacts = responseData.data as Contact[];
    expect(contacts.some((c: Contact) => c.contact_type === "EMAIL")).toBe(
      true,
    );
    expect(contacts.some((c: Contact) => c.contact_type === "PHONE")).toBe(
      true,
    );

    // Check that we got reminder preferences
    const emailContact = contacts.find(
      (c: Contact) => c.contact_type === "EMAIL",
    );
    const phoneContact = contacts.find(
      (c: Contact) => c.contact_type === "PHONE",
    );

    expect(emailContact?.ClientReminderPreference).toBeInstanceOf(Array);
    expect(phoneContact?.ClientReminderPreference).toBeInstanceOf(Array);

    expect(emailContact?.ClientReminderPreference.length).toBe(1);
    expect(phoneContact?.ClientReminderPreference.length).toBe(1);

    expect(emailContact?.ClientReminderPreference[0].reminder_type).toBe(
      "APPOINTMENT",
    );
    expect(phoneContact?.ClientReminderPreference[0].reminder_type).toBe(
      "CANCELLATION",
    );
  });
});
