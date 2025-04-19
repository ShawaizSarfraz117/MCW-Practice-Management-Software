import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SettingsPage from "@/(dashboard)/settings/page";

afterEach(() => {
  vi.clearAllMocks();
});

// Mock next-auth/react first
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

// Mock API function
vi.mock("@/app/actions", () => ({
  fetchProfile: vi.fn().mockResolvedValue({
    id: "test-id",
    email: "test@example.com",
    birthdate: "1990-01-01",
    phone: "123-456-7890",
    profilePhoto: "test.jpg",
  }),
}));

describe("Profile", () => {
  it("should render profile data without crashing", async () => {
    // Create a new QueryClient for each test
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // Turn off retries for testing
          retry: false,
          // Don't refetch on window focus
          refetchOnWindowFocus: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>,
    );

    // Wait for the data to load and appear on screen
    await waitFor(() => {
      expect(screen.getByText("Date of birth")).toBeTruthy();
    });

    expect(screen.getByText("Profile")).toBeTruthy();

    // 1️⃣ email
    expect(await screen.findByText("test@example.com")).toBeTruthy();
  });
});
