import { describe, it, expect } from "vitest";
import {
  validateDateRange,
  createErrorResponse, // Will be used for its own tests later
  validatePagination, // Will be used for its own tests later
} from "@/app/api/analytics/utils/validation"; // Assuming @/ maps to src folder for back-office
import { NextResponse } from "next/server";

describe("validateDateRange", () => {
  // Subtask 6.1: Date Format Validation & Subtask 6.3: Required Fields
  it("should return isValid: true for valid YYYY-MM-DD date strings", () => {
    const result = validateDateRange("2023-01-01", "2023-01-31");
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.startDateObj).toEqual(new Date("2023-01-01T00:00:00Z"));
      expect(result.endDateObj).toEqual(new Date("2023-01-31T23:59:59.999Z"));
    }
  });

  it("should return error if startDate is missing", async () => {
    const result = validateDateRange(undefined, "2023-01-31");
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.response).toBeInstanceOf(NextResponse);
      const body = await result.response.json();
      expect(result.response.status).toBe(400);
      expect(body.error).toBe("Invalid date parameters");
      expect(body.details).toContainEqual({
        field: "startDate",
        message: "Start date is required.",
      });
    }
  });

  it("should return error if endDate is missing", async () => {
    const result = validateDateRange("2023-01-01", undefined);
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.response).toBeInstanceOf(NextResponse);
      const body = await result.response.json();
      expect(result.response.status).toBe(400);
      expect(body.error).toBe("Invalid date parameters");
      expect(body.details).toContainEqual({
        field: "endDate",
        message: "End date is required.",
      });
    }
  });

  it("should return error for invalid startDate format", async () => {
    const result = validateDateRange("01/01/2023", "2023-01-31");
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.response).toBeInstanceOf(NextResponse);
      const body = await result.response.json();
      expect(result.response.status).toBe(400);
      expect(body.error).toBe("Invalid date format");
      expect(body.details).toContainEqual({
        field: "startDate",
        message: "Start date must be in YYYY-MM-DD format.",
      });
    }
  });

  it("should return error for invalid endDate format", async () => {
    const result = validateDateRange("2023-01-01", "31/01/2023");
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.response).toBeInstanceOf(NextResponse);
      const body = await result.response.json();
      expect(result.response.status).toBe(400);
      expect(body.error).toBe("Invalid date format");
      expect(body.details).toContainEqual({
        field: "endDate",
        message: "End date must be in YYYY-MM-DD format.",
      });
    }
  });

  it("should return error for non-sensical date string (e.g., YYYY-MM-32)", async () => {
    const result = validateDateRange("2023-01-32", "2023-01-31");
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe("Invalid date value"); // As per current implementation
      expect(body.details).toContainEqual({
        field: "startDate",
        message: "Start date is invalid.",
      });
    }
  });

  // Subtask 6.2: Date Range Logic
  it("should return error if endDate is before startDate", async () => {
    const result = validateDateRange("2023-01-31", "2023-01-01");
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.response).toBeInstanceOf(NextResponse);
      const body = await result.response.json();
      expect(result.response.status).toBe(400);
      expect(body.error).toBe("End date must be on or after start date.");
      expect(body.details).toContainEqual({
        field: "endDate",
        message: "End date must be on or after start date.",
      });
    }
  });

  it("should be valid if startDate and endDate are the same", () => {
    const result = validateDateRange("2023-01-01", "2023-01-01");
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.startDateObj).toEqual(new Date("2023-01-01T00:00:00Z"));
      expect(result.endDateObj).toEqual(new Date("2023-01-01T23:59:59.999Z"));
    }
  });
});

describe("validatePagination", () => {
  it("should return isValid: true with default values if no params are provided", () => {
    const result = validatePagination(undefined, undefined);
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    }
  });

  it("should return isValid: true for valid string pagination parameters", () => {
    const result = validatePagination("2", "20");
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(20);
    }
  });

  it("should use default pageSize if only page is provided and valid", () => {
    const result = validatePagination("3", undefined);
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(10);
    }
  });

  it("should use default page if only pageSize is provided and valid", () => {
    const result = validatePagination(undefined, "50");
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(50);
    }
  });

  it("should return error for non-numeric page string", async () => {
    const result = validatePagination("abc", "10");
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.response).toBeInstanceOf(NextResponse);
      const body = await result.response.json();
      expect(result.response.status).toBe(400);
      expect(body.error).toBe("Invalid pagination parameters");
      expect(body.details).toContainEqual({
        field: "page",
        message: "Page must be a positive integer.",
      });
    }
  });

  it("should return error for non-numeric pageSize string", async () => {
    const result = validatePagination("1", "xyz");
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.response).toBeInstanceOf(NextResponse);
      const body = await result.response.json();
      expect(result.response.status).toBe(400);
      expect(body.error).toBe("Invalid pagination parameters");
      expect(body.details).toContainEqual({
        field: "pageSize",
        message: "Page size must be a positive integer.",
      });
    }
  });

  it("should return error for page value of 0", async () => {
    const result = validatePagination("0", "10");
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      const body = await result.response.json();
      expect(body.details).toContainEqual({
        field: "page",
        message: "Page must be a positive integer.",
      });
    }
  });

  it("should return error for pageSize value of 0", async () => {
    const result = validatePagination("1", "0");
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      const body = await result.response.json();
      expect(body.details).toContainEqual({
        field: "pageSize",
        message: "Page size must be a positive integer.",
      });
    }
  });

  it("should return error for negative page value", async () => {
    const result = validatePagination("-1", "10");
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      const body = await result.response.json();
      expect(body.details).toContainEqual({
        field: "page",
        message: "Page must be a positive integer.",
      });
    }
  });

  it("should return error for negative pageSize value", async () => {
    const result = validatePagination("1", "-5");
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      const body = await result.response.json();
      expect(body.details).toContainEqual({
        field: "pageSize",
        message: "Page size must be a positive integer.",
      });
    }
  });

  it("should handle null inputs by using defaults", () => {
    const result = validatePagination(null, null);
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    }
  });
});

describe("createErrorResponse", () => {
  it("should create a NextResponse with the correct status and simple error message", async () => {
    const message = "Test error message";
    const status = 400;
    const response = createErrorResponse(message, status);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(status);
    const body = await response.json();
    expect(body.error).toBe(message);
    expect(body.details).toBeUndefined(); // No details provided
  });

  it("should include string array details in the response body when provided", async () => {
    const message = "Validation failed";
    const status = 422;
    const details = ["Field A is required", "Field B must be a number"];
    const response = createErrorResponse(message, status, details);

    expect(response.status).toBe(status);
    const body = await response.json();
    expect(body.error).toBe(message);
    expect(body.details).toEqual(details);
  });

  it("should include ValidationError array details in the response body when provided", async () => {
    const message = "Detailed validation failed";
    const status = 400;
    const details = [
      { field: "email", message: "Email is invalid" },
      { field: "password", message: "Password too short" },
    ];
    const response = createErrorResponse(message, status, details);

    expect(response.status).toBe(status);
    const body = await response.json();
    expect(body.error).toBe(message);
    expect(body.details).toEqual(details);
  });

  it("should handle a different status code correctly", async () => {
    const message = "Not found";
    const status = 404;
    const response = createErrorResponse(message, status);

    expect(response.status).toBe(status);
    const body = await response.json();
    expect(body.error).toBe(message);
  });
});

// describe("createErrorResponse", () => {
//   // Tests for createErrorResponse will go here (Subtask 6.5)
// });
