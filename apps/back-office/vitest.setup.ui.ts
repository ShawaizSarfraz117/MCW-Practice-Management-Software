import { expect, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock Next.js router
vi.mock("next/router", () => ({
  useRouter: vi.fn(),
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
