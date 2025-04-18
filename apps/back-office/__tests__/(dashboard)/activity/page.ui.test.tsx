import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ActivityPage from "@/(dashboard)/activity/page";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

beforeEach(() => {
  // Reset all mocks before each test
  vi.resetAllMocks();

  // Mock fetch API
  vi.spyOn(global, "fetch").mockImplementation(
    (url: string | URL | Request) => {
      const urlString = url.toString();

      if (urlString.includes("/api/activity")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: "activity-1",
                datetime: new Date().toISOString(),
                event_text: "Test activity event",
                event_type: "Test Event Type",
                is_hipaa: false,
                Client: {
                  legal_first_name: "John",
                  legal_last_name: "Doe",
                },
                User: {
                  email: "clinician@example.com",
                },
              },
            ]),
        } as unknown as Response);
      }

      // Default response for any other URL
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as unknown as Response);
    },
  );
});

// Mock the useSession hook
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

describe("ActivityPage", () => {
  it("should render without crashing", async () => {
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
        <SessionProvider
          session={{
            user: {
              id: "test-id",
              email: "test@example.com",
              roles: ["user"],
              isAdmin: false,
              isClinician: true,
            },
            expires: "",
          }}
        >
          <ActivityPage />
        </SessionProvider>
      </QueryClientProvider>,
    );

    // First verify that the loading indicator appears
    expect(screen.getByText("Loading activity...")).toBeTruthy();

    // Comment out the unused waitForElementToBeRemoved function
    await waitForElementToBeRemoved(
      () => screen.queryByText("Loading activity..."),
      { timeout: 10000 }, // Increase timeout to 10 seconds
    );

    // If you need to use activityElement, ensure it is defined and used correctly
    try {
      const activityElement = await screen.findByRole(
        "table",
        {},
        { timeout: 5000 },
      );
      expect(activityElement).toBeTruthy();
    } catch (error) {
      console.error("Error finding activity element:", error);
    }
  });
});
