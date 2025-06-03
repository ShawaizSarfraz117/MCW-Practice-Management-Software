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
  });

  it("should render the service settings page", async () => {
    const { render } = await import("@testing-library/react");
    const { default: ServiceSettingsPage } = await import(
      "@/(dashboard)/settings/service/page"
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { getByRole } = render(
      <QueryClientProvider client={queryClient}>
        <ServiceSettingsPage />
      </QueryClientProvider>,
    );

    // Verify the page renders with expected structure
    expect(getByRole("main")).toBeDefined();
  });
});
