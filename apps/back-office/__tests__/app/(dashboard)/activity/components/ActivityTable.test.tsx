import { render, screen } from "@testing-library/react";
import { ActivityTable } from "@/app/(dashboard)/activity/components/ActivityTable";
import { describe, it, expect, vi } from "vitest";
import { MockComponentProps } from "../../../../types";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, className }: MockComponentProps) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("ActivityTable", () => {
  const mockActivities = [
    {
      date: "2024-03-20",
      time: "10:00 AM",
      event: "Appointment scheduled for John Doe",
      ipAddress: "192.168.1.1",
      location: "New York, USA",
      clientId: "123",
      clientName: "John Doe",
    },
    {
      date: "2024-03-21",
      time: "11:00 AM",
      event: "Payment received",
      ipAddress: "192.168.1.2",
      location: "Los Angeles, USA",
    },
  ];

  it("renders table headers correctly", () => {
    render(<ActivityTable activities={mockActivities} />);

    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("Event")).toBeInTheDocument();
  });

  it("renders activities data correctly", () => {
    render(<ActivityTable activities={mockActivities} />);

    expect(screen.getByText("2024-03-20")).toBeInTheDocument();
    expect(screen.getByText("10:00 AM")).toBeInTheDocument();
    expect(screen.getByText("2024-03-21")).toBeInTheDocument();
    expect(screen.getByText("11:00 AM")).toBeInTheDocument();
    expect(screen.getByText("Payment received")).toBeInTheDocument();
  });

  it("renders client name as link when clientId and clientName are provided", () => {
    render(<ActivityTable activities={mockActivities} />);

    const clientLink = screen.getByText("John Doe");
    expect(clientLink.tagName.toLowerCase()).toBe("a");
    expect(clientLink).toHaveAttribute("href", "/clients/123");
    expect(clientLink).toHaveClass("text-[#2d8467]");
  });

  it("shows details when showDetails is true", () => {
    render(<ActivityTable activities={mockActivities} showDetails={true} />);

    expect(screen.getByText(/IP Address 192\.168\.1\.1/)).toBeInTheDocument();
    expect(screen.getByText(/New York, USA/)).toBeInTheDocument();
  });

  it("hides details when showDetails is false", () => {
    render(<ActivityTable activities={mockActivities} showDetails={false} />);

    expect(
      screen.queryByText(/IP Address 192\.168\.1\.1/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/New York, USA/)).not.toBeInTheDocument();
  });

  it("handles activities without client information", () => {
    const activitiesWithoutClient = [
      {
        date: "2024-03-21",
        time: "11:00 AM",
        event: "System update completed",
        ipAddress: "192.168.1.2",
        location: "Los Angeles, USA",
      },
    ];

    render(<ActivityTable activities={activitiesWithoutClient} />);

    expect(screen.getByText("System update completed")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("handles empty activities array", () => {
    render(<ActivityTable activities={[]} />);

    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("Event")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
