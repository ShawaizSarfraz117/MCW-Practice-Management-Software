/**
 * Utility functions for parsing and formatting survey note content
 */

export interface ParsedContent {
  [key: string]: unknown;
}

/**
 * Parses JSON content safely and returns the parsed object or null
 */
export function parseSurveyContent(
  content: string | null | undefined,
): ParsedContent | null {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object") {
      return parsed as ParsedContent;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Formats a field name from camelCase to human-readable format
 */
export function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

/**
 * Checks if a value is empty (null, undefined, or empty string)
 */
export function isEmptyValue(value: unknown): boolean {
  return !value || (typeof value === "string" && value.trim() === "");
}

/**
 * Checks if a string contains HTML tags
 */
export function containsHtmlTags(text: string): boolean {
  return /<[^>]*>/g.test(text);
}

/**
 * Gets the display content from parsed content object
 * Looks for common fields like summary, content, or description
 */
export function getDisplayContent(
  parsedContent: ParsedContent,
): string | ParsedContent {
  const displayContent =
    parsedContent.summary ||
    parsedContent.content ||
    parsedContent.description ||
    "Content available but format not recognized";

  return displayContent;
}

/**
 * Formats a date value to a localized string
 */
export function formatDate(
  dateValue: Date | string | undefined | null,
): string {
  if (!dateValue) return "Date not available";

  try {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? "Invalid date" : date.toLocaleString();
  } catch {
    return "Date formatting error";
  }
}
