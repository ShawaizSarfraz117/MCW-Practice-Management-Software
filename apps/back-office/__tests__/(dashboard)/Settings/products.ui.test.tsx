import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProductsBilling from "../../../src/app/(dashboard)/settings/components/products";
import { useProductsList } from "../../../src/app/(dashboard)/settings/components/products/hooks/useProductsList";

afterEach(() => {
  vi.clearAllMocks();
});

// Mock next-auth/react
vi.mock("next-auth/react", async () => {
  const actual = await vi.importActual("next-auth/react");
  return {
    ...actual,
    useSession: () => ({
      data: {
        user: {
          id: "test-id",
          email: "test@example.com",
          roles: ["user"],
          isAdmin: false,
          isClinician: true,
        },
      },
      status: "authenticated",
    }),
  };
});

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock useProductsList hook
vi.mock(
  "../../../src/app/(dashboard)/settings/components/products/hooks/useProductsList",
  () => ({
    useProductsList: () => ({
      productList: [
        {
          id: "1",
          name: "Test Product",
          price: "100",
        },
      ],
      isLoading: false,
      error: null,
    }),
  }),
);

describe("Products", () => {
  it("should render products page without crashing", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProductsBilling />
      </QueryClientProvider>,
    );

    // Check if main elements are rendered
    expect(screen.getByText("Products")).toBeTruthy();
    expect(screen.getByText("Manage products and set rates")).toBeTruthy();
    expect(screen.getByText("Save Changes")).toBeTruthy();

    // Check if product form is rendered
    await waitFor(() => {
      expect(screen.getByText("Test Product")).toBeTruthy();
    });
  });

  it("should show 'No Products Found' when product list is empty", async () => {
    // Mock empty product list
    vi.mocked(useProductsList).mockReturnValue({
      productList: [],
      isLoading: false,
      error: null,
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProductsBilling />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("No Products Found")).toBeTruthy();
    });
  });
});
