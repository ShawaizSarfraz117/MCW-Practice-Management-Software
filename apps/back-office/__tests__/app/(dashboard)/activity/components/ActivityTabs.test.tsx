import { render, screen } from "@testing-library/react";
import { ActivityTabs } from "@/app/(dashboard)/activity/components/ActivityTabs";
import { describe, it, expect, vi } from "vitest";
import { MockComponentProps } from "../../../../types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, className }: MockComponentProps) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("ActivityTabs", () => {
  const usePathname = vi.fn();
  // vi.mock("next/navigation", () => ({ usePathname }));

  it("renders all navigation links", () => {
    usePathname.mockReturnValue("/activity");
    render(<ActivityTabs />);

    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("Sign In Events")).toBeInTheDocument();
    expect(screen.getByText("HIPAA Audit Log")).toBeInTheDocument();
  });

  it("applies active class to History tab when on /activity", () => {
    usePathname.mockReturnValue("/activity");
    render(<ActivityTabs />);

    const historyLink = screen.getByText("History");
    expect(historyLink).toHaveClass("text-[#2d8467]");
    expect(historyLink).toHaveClass("border-[#2d8467]");
  });

  it("applies active class to Sign In Events tab when on /activity/sign-in-events", () => {
    usePathname.mockReturnValue("/activity/sign-in-events");
    render(<ActivityTabs />);

    const signInEventsLink = screen.getByText("Sign In Events");
    expect(signInEventsLink).toHaveClass("text-[#2d8467]");
    expect(signInEventsLink).toHaveClass("border-[#2d8467]");
  });

  it("applies active class to HIPAA Audit Log tab when on /activity/hipaa-audit-log", () => {
    usePathname.mockReturnValue("/activity/hipaa-audit-log");
    render(<ActivityTabs />);

    const hipaaAuditLogLink = screen.getByText("HIPAA Audit Log");
    expect(hipaaAuditLogLink).toHaveClass("text-[#2d8467]");
    expect(hipaaAuditLogLink).toHaveClass("border-[#2d8467]");
  });

  it("applies inactive class to non-active tabs", () => {
    usePathname.mockReturnValue("/activity");
    render(<ActivityTabs />);

    const signInEventsLink = screen.getByText("Sign In Events");
    const hipaaAuditLogLink = screen.getByText("HIPAA Audit Log");

    expect(signInEventsLink).toHaveClass("text-[#6b7280]");
    expect(hipaaAuditLogLink).toHaveClass("text-[#6b7280]");
  });
});
