import { describe, it, expect } from "vitest";

describe("Email Template Processing - Unit Tests", () => {
  describe("Variable Substitution", () => {
    it("should handle basic variable substitution", () => {
      const template = "Hello {name}, welcome to {company}!";
      const variables = {
        name: "John",
        company: "Test Corp",
      };

      let processed = template;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{\\s*${key}\\s*}`, "g");
        processed = processed.replace(regex, value);
      });

      expect(processed).toBe("Hello John, welcome to Test Corp!");
    });

    it("should handle missing variables gracefully", () => {
      const template = "Hello {name}, your appointment is on {date} at {time}";
      const variables = {
        name: "John",
        // date is missing
        // time is missing
      };

      let processed = template;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{\\s*${key}\\s*}`, "g");
        processed = processed.replace(regex, value || "");
      });

      // Missing variables remain as placeholders
      expect(processed).toBe(
        "Hello John, your appointment is on {date} at {time}",
      );
    });

    it("should handle null/undefined values", () => {
      const template = "Name: {name}, Email: {email}";
      const variables = {
        name: null,
        email: undefined,
      };

      let processed = template;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{\\s*${key}\\s*}`, "g");
        processed = processed.replace(regex, String(value ?? ""));
      });

      expect(processed).toBe("Name: , Email: ");
    });

    it("should handle special characters in variable names", () => {
      const template = "Hello {user_name}, {user-id}";
      const variables = {
        user_name: "John Doe",
        "user-id": "12345",
      };

      let processed = template;
      Object.entries(variables).forEach(([key, value]) => {
        // Escape special regex characters
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
        const regex = new RegExp(`{\\s*${escapedKey}\\s*}`, "g");
        processed = processed.replace(regex, value);
      });

      expect(processed).toBe("Hello John Doe, 12345");
    });

    it("should handle complex variable substitution", () => {
      const complexTemplate = {
        subject: "Order {orderId} - {status}",
        content:
          "Dear {customerName},\n\nYour order {orderId} is {status}.\nTotal: ${amount}",
      };

      const variables = {
        customerName: "Jane Doe",
        orderId: "12345",
        status: "Shipped",
        amount: "99.99",
      };

      let processedSubject = complexTemplate.subject;
      let processedContent = complexTemplate.content;

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{\\s*${key}\\s*}`, "g");
        processedSubject = processedSubject.replace(regex, value);
        processedContent = processedContent.replace(regex, value);
      });

      expect(processedSubject).toBe("Order 12345 - Shipped");
      expect(processedContent).toBe(
        "Dear Jane Doe,\n\nYour order 12345 is Shipped.\nTotal: $99.99",
      );
    });

    it("should handle HTML content", () => {
      const htmlTemplate = {
        content: "<h1>Welcome {name}</h1><p>This is HTML content</p>",
      };

      const variables = { name: "John" };

      let processedContent = htmlTemplate.content;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{\\s*${key}\\s*}`, "g");
        processedContent = processedContent.replace(regex, value);
      });

      expect(processedContent).toBe(
        "<h1>Welcome John</h1><p>This is HTML content</p>",
      );
    });
  });
});
