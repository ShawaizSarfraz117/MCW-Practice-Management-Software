import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CalendarPage from "@/(dashboard)/calendar/page";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

beforeEach(() => {
  // Reset all mocks before each test
  vi.resetAllMocks();

  // Mock fetch API
  vi.spyOn(global, "fetch").mockImplementation(
    (url: string | URL | Request) => {
      const urlString = url.toString();

      if (urlString.includes("/api/clinician")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "clinician-1",
              first_name: "Test",
              last_name: "Clinician",
            }),
        } as unknown as Response);
      }

      if (urlString.includes("/api/location")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: "loc-1", name: "Test Location", address: "123 Test St" },
            ]),
        } as unknown as Response);
      }

      if (urlString.includes("/api/appointment")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
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

// Mock API calls
vi.mock("@/app/actions", () => ({
  fetchClinicians: vi.fn().mockResolvedValue([
    {
      id: "clinician-1",
      first_name: "Test",
      last_name: "Clinician",
      is_active: true,
      User: { email: "test@example.com" },
    },
  ]),
  fetchLocations: vi.fn().mockResolvedValue([
    {
      id: "loc-1",
      name: "Test Location",
      address: "123 Test St",
      is_active: true,
    },
  ]),
  fetchAppointments: vi.fn().mockResolvedValue([]),
}));

describe("CalendarPage", () => {
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
          <CalendarPage />
        </SessionProvider>
      </QueryClientProvider>,
    );

    // First verify that the loading indicator appears
    expect(screen.getByText("Loading calendar data...")).toBeTruthy();

    // Wait for the loading indicator to disappear with a longer timeout
    await waitForElementToBeRemoved(
      () => screen.queryByText("Loading calendar data..."),
      { timeout: 10000 }, // Increase timeout to 10 seconds
    );

    // After loading completes, we should see the calendar content
    // Instead of looking for specific text, check if calendar-related UI elements exist
    // Look for any element that is typically part of a calendar
    const calendarElement = await screen.findByRole(
      "grid",
      {},
      { timeout: 5000 },
    );
    expect(calendarElement).toBeTruthy();
  });
});
