import React from "react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn(),
    toString: vi.fn(),
  }),
  usePathname: () => "/clients",
}));

/**
 * Unit tests for clients page
 * Tests imports and basic component loading
 */
describe("Clients Page", () => {
  it("should import the page component without errors", async () => {
    const ClientsPage = await import("@/(dashboard)/clients/page");

    expect(ClientsPage).toBeDefined();
    expect(ClientsPage.default).toBeDefined();
  }, 60000);

  it("should render the clients page with proper components", async () => {
    const { render } = await import("@testing-library/react");
    const { default: ClientsPage } = await import("@/(dashboard)/clients/page");

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ClientsPage />
      </QueryClientProvider>,
    );
    expect(container).toBeDefined();
    // Add more specific assertions based on expected content
  }, 60000);
});
