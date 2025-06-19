import { describe, it, expect, vi } from "vitest";

// Mock React Query dependencies
vi.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: vi.fn().mockReturnValue({
    data: null,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    error: null,
  }),
}));

// Mock UI components
vi.mock("@mcw/ui", () => ({
  useToast: vi.fn().mockReturnValue({
    toast: vi.fn(),
  }),
}));

// Mock utils
vi.mock("@mcw/utils", () => ({
  showErrorToast: vi.fn(),
}));

// Mock component dependencies
vi.mock(
  "@/(dashboard)/billing/documents/components/BillingDocumentsTable",
  () => ({
    default: () => null,
  }),
);

vi.mock(
  "@/(dashboard)/billing/documents/components/BillingDocumentsFilters",
  () => ({
    default: () => null,
  }),
);

// Mock Lucide React icons
vi.mock("lucide-react", () => ({
  FileText: () => null,
}));

/**
 * Unit tests for billing documents page
 * Tests imports and basic component loading
 */
describe("Billing Documents Page", () => {
  it("should import the page component without errors", async () => {
    const BillingDocumentsPage = await import(
      "../../../../src/app/(dashboard)/billing/documents/page"
    );

    expect(BillingDocumentsPage).toBeDefined();
    expect(BillingDocumentsPage.default).toBeDefined();
  });
});
