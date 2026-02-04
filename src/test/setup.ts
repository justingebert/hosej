// Set test environment variables before any imports
process.env.MONGODB_URI = "mongodb://test:27017/test";

import React from "react";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Global test setup
// Add any global mocks or setup here

// Mock next/link for component tests
vi.mock("next/link", () => ({
    __esModule: true,
    default: ({
        href,
        children,
        ...props
    }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>) =>
        React.createElement("a", { href, ...props }, children),
}));

// Radix (and other UI libs) may rely on ResizeObserver
class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

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
