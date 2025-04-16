import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "vitest" {
  interface Assertion
    extends TestingLibraryMatchers<string | Element | null | undefined, void> {
    // Add any custom matchers here if needed
    toBeValidDate(): void;
  }
}

// Add custom matcher implementation
expect.extend({
  toBeValidDate(received: unknown) {
    const date = new Date(received as string | number | Date);
    const isValid = date instanceof Date && !isNaN(date.getTime());

    return {
      pass: isValid,
      message: () =>
        `expected ${received} to ${isValid ? "not " : ""}be a valid date`,
    };
  },
  ...matchers,
});
