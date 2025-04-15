import { render, screen } from "@testing-library/react";
import ActivityPage from "@/app/(dashboard)/activity/page";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { Activity, MockComponentProps } from "../../../types";

// Mock child components
vi.mock("@/app/(dashboard)/activity/components/ActivityTable", () => ({
  ActivityTable: ({
    activities,
    showDetails,
  }: {
    activities: Activity[];
    showDetails: boolean;
  }) => (
    <div data-testid="activity-table">
      <div data-testid="activities-count">{activities.length}</div>
      <div data-testid="show-details">{showDetails.toString()}</div>
      {activities.map((activity: Activity, index: number) => (
        <div key={index} data-testid="activity-item">
          {activity.event}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/app/(dashboard)/activity/components/ActivityFilters", () => ({
  ActivityFilters: ({
    onSearch,
    onDateRangeChange,
    onEventTypeChange,
    onToggleDetails,
  }: MockComponentProps) => (
    <div data-testid="activity-filters">
      <input
        data-testid="search-input"
        onChange={(e) => onSearch?.(e.target.value)}
      />
      <select
        data-testid="event-type-select"
        onChange={(e) => onEventTypeChange?.(e.target.value)}
      >
        <option value="all-events">All Events</option>
        <option value="appointments">Appointments</option>
        <option value="payments">Payments</option>
        <option value="client-updates">Client Updates</option>
      </select>
      <button
        data-testid="date-range-button"
        onClick={() =>
          onDateRangeChange?.(new Date("2024-03-01"), new Date("2024-03-31"))
        }
      >
        Set Date Range
      </button>
      <button data-testid="toggle-details" onClick={onToggleDetails}>
        Toggle Details
      </button>
    </div>
  ),
}));

vi.mock("@/app/(dashboard)/activity/components/ActivityTabs", () => ({
  ActivityTabs: () => <div data-testid="activity-tabs">Activity Tabs</div>,
}));

describe("ActivityPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all components correctly", () => {
    render(<ActivityPage />);

    expect(screen.getByText("Account Activity")).toBeInTheDocument();
    expect(screen.getByTestId("activity-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("activity-filters")).toBeInTheDocument();
    expect(screen.getByTestId("activity-table")).toBeInTheDocument();
  });

  it("filters activities by search query", async () => {
    render(<ActivityPage />);

    const searchInput = screen.getByTestId("search-input");
    await userEvent.type(searchInput, "Shawaiz");

    const activitiesCount = screen.getByTestId("activities-count");
    expect(activitiesCount.textContent).toBe("1");

    const activities = screen.getAllByTestId("activity-item");
    expect(activities[0].textContent).toContain("Shawaiz Sarfraz");
  });

  it("filters activities by event type", async () => {
    render(<ActivityPage />);

    const eventTypeSelect = screen.getByTestId("event-type-select");
    await userEvent.selectOptions(eventTypeSelect, "appointments");

    const activities = screen.getAllByTestId("activity-item");
    expect(activities).toHaveLength(2); // Should show only appointment-related activities
    activities.forEach((activity) => {
      expect(activity.textContent?.toLowerCase()).toContain("appointment");
    });
  });

  it("filters activities by date range", async () => {
    render(<ActivityPage />);

    const dateRangeButton = screen.getByTestId("date-range-button");
    await userEvent.click(dateRangeButton);

    // Since our mock data is all from February 2025, and we're setting range to March 2024,
    // we should see no activities
    const activitiesCount = screen.getByTestId("activities-count");
    expect(activitiesCount.textContent).toBe("0");
  });

  it("toggles activity details", async () => {
    render(<ActivityPage />);

    const toggleButton = screen.getByTestId("toggle-details");
    const showDetails = screen.getByTestId("show-details");

    // Initial state should be true
    expect(showDetails.textContent).toBe("true");

    // Click toggle button
    await userEvent.click(toggleButton);
    expect(showDetails.textContent).toBe("false");

    // Click toggle button again
    await userEvent.click(toggleButton);
    expect(showDetails.textContent).toBe("true");
  });

  it("combines multiple filters correctly", async () => {
    render(<ActivityPage />);

    // Set event type to appointments
    const eventTypeSelect = screen.getByTestId("event-type-select");
    await userEvent.selectOptions(eventTypeSelect, "appointments");

    // Add search query
    const searchInput = screen.getByTestId("search-input");
    await userEvent.type(searchInput, "Shawaiz");

    // Should show only one activity that matches both filters
    const activitiesCount = screen.getByTestId("activities-count");
    expect(activitiesCount.textContent).toBe("1");

    const activities = screen.getAllByTestId("activity-item");
    expect(activities[0].textContent).toContain("Shawaiz Sarfraz");
    expect(activities[0].textContent?.toLowerCase()).toContain("appointment");
  });

  it("handles empty search results", async () => {
    render(<ActivityPage />);

    const searchInput = screen.getByTestId("search-input");
    await userEvent.type(searchInput, "nonexistent");

    const activitiesCount = screen.getByTestId("activities-count");
    expect(activitiesCount.textContent).toBe("0");
  });

  it("filters client updates correctly", async () => {
    render(<ActivityPage />);

    const eventTypeSelect = screen.getByTestId("event-type-select");
    await userEvent.selectOptions(eventTypeSelect, "client-updates");

    const activities = screen.getAllByTestId("activity-item");
    activities.forEach((activity) => {
      const text = activity.textContent?.toLowerCase() || "";
      expect(text.includes("profile") || text.includes("intake")).toBeTruthy();
    });
  });

  it("filters payment activities correctly", async () => {
    render(<ActivityPage />);

    const eventTypeSelect = screen.getByTestId("event-type-select");
    await userEvent.selectOptions(eventTypeSelect, "payments");

    const activities = screen.getAllByTestId("activity-item");
    activities.forEach((activity) => {
      expect(activity.textContent?.toLowerCase()).toContain("payment");
    });
  });
});
