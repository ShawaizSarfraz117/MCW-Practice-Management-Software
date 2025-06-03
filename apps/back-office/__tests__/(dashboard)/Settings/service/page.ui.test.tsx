import React from "react";
import { describe, it, expect } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Unit tests for service settings page
 * Tests imports and basic component loading
 */
describe("Service Settings Page", () => {
  it("should import the page component without errors", async () => {
    const ServiceSettingsPage = await import(
      "@/(dashboard)/settings/service/page"
    );

    expect(ServiceSettingsPage).toBeDefined();
    expect(ServiceSettingsPage.default).toBeDefined();
  }, 60000);

  it("should render the service settings page", async () => {
    const { render, screen } = await import("@testing-library/react");
    const { default: ServiceSettingsPage } = await import(
      "@/(dashboard)/settings/service/page"
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ServiceSettingsPage />
      </QueryClientProvider>,
    );

    // Verify the page renders with expected structure
    expect(screen.getByRole("heading", { name: "Services" })).toBeDefined();
    expect(screen.getByText("Manage services and set rates.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Add Services" })).toBeDefined();
  }, 60000);
});
