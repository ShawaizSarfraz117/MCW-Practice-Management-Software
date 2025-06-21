import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@mcw/database";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { GET, PUT } from "@/api/client-care-settings/route";
import { createRequest, createRequestWithBody } from "@mcw/utils";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
// Mock auth options
vi.mock("../../../src/app/api/auth/[...nextauth]/auth-options", () => ({
  backofficeAuthOptions: {},
}));

// Import after mocking
import { getServerSession } from "next-auth";

describe("Calendar Settings - Practice Wide", () => {
  const clinician1Id = randomUUID();
  const clinician2Id = randomUUID();

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.practiceSettings.deleteMany({
      where: {
        key: {
          startsWith: "calendar_",
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.practiceSettings.deleteMany({
      where: {
        key: {
          startsWith: "calendar_",
        },
      },
    });
  });

  it("should store calendar settings practice-wide regardless of clinician", async () => {
    // Mock auth for clinician 1
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: clinician1Id, email: "clinician1@test.com" },
      expires: "",
    });

    // Set calendar settings as clinician 1
    const calendarSettings = {
      display: {
        startTime: "6:00 AM",
        endTime: "10:00 PM",
        viewMode: "week",
        showWeekends: true,
        cancellationNoticeHours: 48,
      },
    };

    const putRequest = createRequestWithBody(
      "/api/client-care-settings",
      {
        category: "calendar",
        settings: calendarSettings,
      },
      {
        method: "PUT",
      },
    );

    const putResponse = await PUT(putRequest as NextRequest);
    const putData = await putResponse.json();

    if (putResponse.status !== 200) {
      console.error("PUT failed with:", putData);
    }

    expect(putResponse.status).toBe(200);
    expect(putData.message).toBe("Client care settings updated successfully");

    // Verify settings are stored as individual key-value pairs in PracticeSettings table
    const storedSettings = await prisma.practiceSettings.findMany({
      where: {
        key: {
          startsWith: "calendar_",
        },
      },
    });

    // Should have 5 individual settings
    expect(storedSettings.length).toBe(5);

    // Check specific settings
    const startTimeSetting = storedSettings.find(
      (s) => s.key === "calendar_start_time",
    );
    expect(startTimeSetting?.value).toBe("6:00 AM");

    const showWeekendsSetting = storedSettings.find(
      (s) => s.key === "calendar_show_weekends",
    );
    expect(showWeekendsSetting?.value).toBe("true");

    const cancellationHoursSetting = storedSettings.find(
      (s) => s.key === "calendar_cancellation_notice_hours",
    );
    expect(cancellationHoursSetting?.value).toBe("48");

    // Mock auth for clinician 2
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: clinician2Id, email: "clinician2@test.com" },
      expires: "",
    });

    // Get calendar settings as clinician 2
    const getRequest = createRequest(
      "/api/client-care-settings?category=calendar",
      {
        method: "GET",
      },
    );

    const getResponse = await GET(getRequest as NextRequest);
    const getData = await getResponse.json();

    expect(getResponse.status).toBe(200);
    // Clinician 2 should see the same settings that clinician 1 set
    expect(getData.data).toEqual(calendarSettings);

    // Update settings as clinician 2
    const updatedSettings = {
      display: {
        startTime: "8:00 AM",
        endTime: "9:00 PM",
        viewMode: "day",
        showWeekends: false,
        cancellationNoticeHours: 24,
      },
    };

    const putRequest2 = createRequestWithBody(
      "/api/client-care-settings",
      {
        category: "calendar",
        settings: updatedSettings,
      },
      {
        method: "PUT",
      },
    );

    const putResponse2 = await PUT(putRequest2 as NextRequest);
    expect(putResponse2.status).toBe(200);

    // Switch back to clinician 1 and verify they see the updated settings
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: clinician1Id, email: "clinician1@test.com" },
      expires: "",
    });

    const getRequest2 = createRequest(
      "/api/client-care-settings?category=calendar",
      {
        method: "GET",
      },
    );

    const getResponse2 = await GET(getRequest2 as NextRequest);
    const getData2 = await getResponse2.json();

    expect(getResponse2.status).toBe(200);
    // Clinician 1 should now see the updated settings from clinician 2
    expect(getData2.data).toEqual(updatedSettings);
  });

  it("should have individual calendar settings records in PracticeSettings", async () => {
    // Verify we have individual records for each calendar setting
    const calendarSettings = await prisma.practiceSettings.findMany({
      where: {
        key: {
          startsWith: "calendar_",
        },
      },
    });

    // Should have 5 settings after the update
    expect(calendarSettings.length).toBe(5);

    // Verify the keys follow the expected pattern
    const expectedKeys = [
      "calendar_start_time",
      "calendar_end_time",
      "calendar_view_mode",
      "calendar_show_weekends",
      "calendar_cancellation_notice_hours",
    ];

    const actualKeys = calendarSettings.map((s) => s.key).sort();
    expect(actualKeys).toEqual(expectedKeys.sort());
  });
});
