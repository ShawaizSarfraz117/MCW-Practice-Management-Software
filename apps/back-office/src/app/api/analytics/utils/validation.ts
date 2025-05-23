import { NextResponse } from "next/server";

export interface ValidationError {
  field: string;
  message: string;
}

export function createErrorResponse(
  message: string,
  status: number,
  errors?: ValidationError[] | string[],
) {
  return NextResponse.json({ error: message, details: errors }, { status });
}

/**
 * Validates date strings and their logical range.
 * @param startDate - The start date string (YYYY-MM-DD).
 * @param endDate - The end date string (YYYY-MM-DD).
 * @returns An object with isValid, or an error response object.
 */
export function validateDateRange(
  startDate?: string,
  endDate?: string,
):
  | { isValid: true; startDateObj: Date; endDateObj: Date }
  | { isValid: false; response: NextResponse } {
  const errors: ValidationError[] = [];

  if (!startDate) {
    errors.push({ field: "startDate", message: "Start date is required." });
  }
  if (!endDate) {
    errors.push({ field: "endDate", message: "End date is required." });
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      response: createErrorResponse("Invalid date parameters", 400, errors),
    };
  }

  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDatePattern.test(startDate!)) {
    errors.push({
      field: "startDate",
      message: "Start date must be in YYYY-MM-DD format.",
    });
  }
  if (!isoDatePattern.test(endDate!)) {
    errors.push({
      field: "endDate",
      message: "End date must be in YYYY-MM-DD format.",
    });
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      response: createErrorResponse("Invalid date format", 400, errors),
    };
  }

  const startDateObj = new Date(startDate! + "T00:00:00Z"); // Interpret as UTC start of day
  const endDateObj = new Date(endDate! + "T23:59:59.999Z"); // Interpret as UTC end of day

  if (isNaN(startDateObj.getTime())) {
    errors.push({ field: "startDate", message: "Start date is invalid." });
  }
  if (isNaN(endDateObj.getTime())) {
    errors.push({ field: "endDate", message: "End date is invalid." });
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      response: createErrorResponse("Invalid date value", 400, errors),
    };
  }

  if (startDateObj > endDateObj) {
    return {
      isValid: false,
      response: createErrorResponse(
        "End date must be on or after start date.",
        400,
        [
          {
            field: "endDate",
            message: "End date must be on or after start date.",
          },
        ],
      ),
    };
  }

  return { isValid: true, startDateObj, endDateObj };
}

/**
 * Validates and parses pagination parameters.
 * @param pageStr - The page number string.
 * @param pageSizeStr - The page size string.
 * @returns An object with parsed page and pageSize, or an error response object.
 */
export function validatePagination(
  pageStr?: string | null,
  pageSizeStr?: string | null,
):
  | { isValid: true; page: number; pageSize: number }
  | { isValid: false; response: NextResponse } {
  const errors: ValidationError[] = [];
  let page = 1;
  let pageSize = 10;

  if (pageStr) {
    page = parseInt(pageStr, 10);
    if (isNaN(page) || page < 1) {
      errors.push({
        field: "page",
        message: "Page must be a positive integer.",
      });
    }
  }

  if (pageSizeStr) {
    pageSize = parseInt(pageSizeStr, 10);
    if (isNaN(pageSize) || pageSize < 1) {
      errors.push({
        field: "pageSize",
        message: "Page size must be a positive integer.",
      });
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      response: createErrorResponse(
        "Invalid pagination parameters",
        400,
        errors,
      ),
    };
  }

  return { isValid: true, page, pageSize };
}
