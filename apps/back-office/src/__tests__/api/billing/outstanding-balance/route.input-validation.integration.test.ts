import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@mcw/database";
// Prisma client is not strictly needed for input validation tests if no DB interaction occurs before validation
// However, maintaining the setup hooks for consistency if other tests are added here later.
import { GET } from "../../../../../src/app/api/billing/outstanding-balance/route";
import { createRequest } from "@mcw/utils";

describe("/api/billing/outstanding-balance Input Validation Integration Tests", () => {
  // These arrays might not be used if tests strictly focus on input validation before DB interaction
  let createdClientIds: string[] = [];
  let createdClientGroupIds: string[] = [];
  let createdAppointmentIds: string[] = [];

  beforeEach(async () => {
    // Minimal setup, as these tests focus on input validation errors
    // Full cleanup might be overkill but kept for consistency
    await prisma.appointment.deleteMany({});
    await prisma.clientGroupMembership.deleteMany({});
    await prisma.clientGroup.deleteMany({});
    await prisma.client.deleteMany({});
    createdClientIds = [];
    createdClientGroupIds = [];
    createdAppointmentIds = [];
  });

  afterEach(async () => {
    // Consistent cleanup
    if (createdAppointmentIds.length > 0) {
      await prisma.appointment.deleteMany({
        where: { id: { in: createdAppointmentIds } },
      });
    }
    if (createdClientIds.length > 0 || createdClientGroupIds.length > 0) {
      const membershipsToDelete = await prisma.clientGroupMembership.findMany({
        where: {
          OR: [
            { client_id: { in: createdClientIds } },
            { client_group_id: { in: createdClientGroupIds } },
          ],
        },
      });
      if (membershipsToDelete.length > 0) {
        await prisma.clientGroupMembership.deleteMany({
          where: {
            OR: [
              { client_id: { in: createdClientIds } },
              { client_group_id: { in: createdClientGroupIds } },
            ],
          },
        });
      }
    }
    if (createdClientGroupIds.length > 0) {
      await prisma.clientGroup.deleteMany({
        where: { id: { in: createdClientGroupIds } },
      });
    }
    if (createdClientIds.length > 0) {
      await prisma.client.deleteMany({
        where: { id: { in: createdClientIds } },
      });
    }
  });

  it("getOutstandingBalances_Error_InvalidDateFormat", async () => {
    const testCases = [
      {
        startDate: "invalid-date",
        endDate: "2024-03-31",
        case: "Invalid startDate",
      },
      {
        startDate: "2024-03-01",
        endDate: "invalid-date",
        case: "Invalid endDate",
      },
      {
        startDate: "2024/03/01",
        endDate: "2024-03-31",
        case: "Wrong format startDate (YYYY/MM/DD)",
      },
      {
        startDate: "03-01-2024",
        endDate: "2024-03-31",
        case: "Wrong format startDate (MM-DD-YYYY)",
      },
      {
        startDate: "2024-03-01",
        endDate: "2024/03/31",
        case: "Wrong format endDate (YYYY/MM/DD)",
      },
      {
        startDate: "2024-03-01",
        endDate: "03-31-2024",
        case: "Wrong format endDate (MM-DD-YYYY)",
      },
      {
        startDate: "2024-13-01",
        endDate: "2024-03-31",
        case: "Invalid month startDate",
      },
      {
        startDate: "2024-03-01",
        endDate: "2024-02-30",
        case: "Invalid day endDate",
      },
      {
        startDate: "2024-03-31",
        endDate: "2024-03-01",
        case: "endDate before startDate",
      },
    ];

    for (const { startDate, endDate, case: testCaseName } of testCases) {
      const req = createRequest(
        `/api/billing/outstanding-balance?startDate=${startDate}&endDate=${endDate}`,
      );
      const response = await GET(req);
      const responseBody = await response.json();

      expect(response.status, `Test Case: ${testCaseName}`).toBe(400);
      expect(responseBody, `Test Case: ${testCaseName}`).toHaveProperty(
        "error",
      );
      if (testCaseName === "endDate before startDate") {
        expect(responseBody.error, `Test Case: ${testCaseName}`).toContain(
          "endDate cannot be before startDate",
        );
      } else {
        expect(responseBody.error, `Test Case: ${testCaseName}`).toContain(
          "Invalid date format",
        );
      }
    }
  });
});
