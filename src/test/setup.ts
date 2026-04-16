import React from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

// Env vars are populated by ./globalSetup.ts before any test file loads,
// so @/env validates against real values (including the memory-server URI).

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

// Prevent firebase-admin from parsing the stub service account at module import.
// Per-test mocks of @/lib/integrations/push still override this where needed.
vi.mock("firebase-admin", () => {
    const messaging = {
        sendEachForMulticast: vi
            .fn()
            .mockResolvedValue({ responses: [], successCount: 0, failureCount: 0 }),
    };
    return {
        default: {
            apps: [{}],
            credential: { cert: vi.fn() },
            initializeApp: vi.fn(),
            messaging: () => messaging,
        },
    };
});

// Mock web-haptics hook used by client components
vi.mock("web-haptics/react", () => ({
    useWebHaptics: () => ({
        trigger: vi.fn(),
        cancel: vi.fn(),
        isSupported: true,
    }),
}));

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

// Mock next/image to a plain <img /> for tests
vi.mock("next/image", () => ({
    __esModule: true,
    default: ({
        src,
        alt,
        ...props
    }: React.ImgHTMLAttributes<HTMLImageElement> & { src?: unknown; alt: string }) => {
        let resolvedSrc = "";
        if (typeof src === "string") {
            resolvedSrc = src;
        } else if (typeof src === "object" && src !== null && "src" in src) {
            const maybeSrc = (src as { src?: unknown }).src;
            if (typeof maybeSrc === "string") resolvedSrc = maybeSrc;
        }

        return React.createElement("img", { ...props, src: resolvedSrc, alt });
    },
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
