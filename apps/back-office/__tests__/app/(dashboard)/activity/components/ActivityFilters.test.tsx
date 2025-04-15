import { render, screen, fireEvent } from "@testing-library/react";
import { ActivityFilters } from "@/app/(dashboard)/activity/components/ActivityFilters";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { MockComponentProps } from "../../../../types";

// Mock @mcw/ui components
vi.mock("@mcw/ui", () => ({
  Input: ({ className, placeholder, onChange }: MockComponentProps) => (
    <input
      className={className}
      placeholder={placeholder}
      onChange={onChange}
      data-testid="search-input"
    />
  ),
  Select: ({ children, defaultValue, onValueChange }: MockComponentProps) => (
    <select
      defaultValue={defaultValue}
      onChange={(e) => onValueChange?.(e.target.value)}
      data-testid="event-type-select"
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: MockComponentProps) => <>{children}</>,
  SelectItem: ({ value, children }: MockComponentProps) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children, className }: MockComponentProps) => (
    <div className={className}>{children}</div>
  ),
  SelectValue: ({ placeholder }: MockComponentProps) => (
    <span>{placeholder}</span>
  ),
  DateRangePicker: ({ handleApplyCustomRange }: MockComponentProps) => (
    <div
      data-testid="date-range-picker"
      onClick={() =>
        handleApplyCustomRange?.(new Date("2024-03-01"), new Date("2024-03-31"))
      }
    >
      Date Range Picker
    </div>
  ),
}));

describe("ActivityFilters", () => {
  const mockProps = {
    onSearch: vi.fn(),
    onDateRangeChange: vi.fn(),
    onEventTypeChange: vi.fn(),
    onToggleDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all filter components", () => {
    render(<ActivityFilters {...mockProps} />);

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(screen.getByTestId("event-type-select")).toBeInTheDocument();
    expect(screen.getByTestId("date-range-picker")).toBeInTheDocument();
    expect(screen.getByText("Hide details")).toBeInTheDocument();
  });

  it("handles search input changes", async () => {
    render(<ActivityFilters {...mockProps} />);

    const searchInput = screen.getByTestId("search-input");
    await userEvent.type(searchInput, "test search");

    expect(mockProps.onSearch).toHaveBeenCalledWith("test search");
  });

  it("handles event type selection", () => {
    render(<ActivityFilters {...mockProps} />);

    const select = screen.getByTestId("event-type-select");
    fireEvent.change(select, { target: { value: "appointments" } });

    expect(mockProps.onEventTypeChange).toHaveBeenCalledWith("appointments");
  });

  it("handles date range selection", () => {
    render(<ActivityFilters {...mockProps} />);

    const dateRangePicker = screen.getByTestId("date-range-picker");
    fireEvent.click(dateRangePicker);

    expect(mockProps.onDateRangeChange).toHaveBeenCalledWith(
      new Date("2024-03-01"),
      new Date("2024-03-31"),
    );
  });

  it("handles toggle details button click", async () => {
    render(<ActivityFilters {...mockProps} />);

    const toggleButton = screen.getByText("Hide details");
    await userEvent.click(toggleButton);

    expect(mockProps.onToggleDetails).toHaveBeenCalledTimes(1);
  });

  it("renders all event type options", () => {
    render(<ActivityFilters {...mockProps} />);

    const select = screen.getByTestId("event-type-select");

    expect(select).toContainElement(screen.getByText("All Events"));
    expect(select).toContainElement(screen.getByText("Appointments"));
    expect(select).toContainElement(screen.getByText("Payments"));
    expect(select).toContainElement(screen.getByText("Client Updates"));
  });

  it("has correct default values", () => {
    render(<ActivityFilters {...mockProps} />);

    const searchInput = screen.getByTestId("search-input");
    const select = screen.getByTestId("event-type-select");

    expect(searchInput).toHaveValue("");
    expect(select).toHaveValue("all-events");
  });
});
