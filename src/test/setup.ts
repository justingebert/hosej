// Set test environment variables before any imports
process.env.MONGODB_URI = "mongodb://test:27017/test";

import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Global test setup
// Add any global mocks or setup here

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
}));
