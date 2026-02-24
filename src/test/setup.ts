import React from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

// Mock validated env module so tests never throw for missing env vars
vi.mock("@/env", () => ({
    env: {
        MONGODB_URI: "mongodb://test:27017/test",
        NEXTAUTH_SECRET: "test-secret",
        AUTH_GOOGLE_ID: "test-google-id",
        AUTH_GOOGLE_SECRET: "test-google-secret",
        FIREBASE_SERVICE_ACCOUNT: JSON.stringify({ project_id: "test" }),
        AWS_REGION: "eu-central-1",
        AWS_BUCKET_NAME: "test-bucket",
        SPOTIFY_CLIENT_ID: "test-spotify-id",
        SPOTIFY_CLIENT_SECRET: "test-spotify-secret",
        CRON_SECRET: "test-cron-secret",
    },
}));

// Global test setup
// Add any global mocks or setup here

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

// use-haptic brings its own React copy; mock to avoid invalid hook call in tests
vi.mock("use-haptic", () => ({
    useHaptic: () => ({ triggerHaptic: () => {} }),
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

// Mock haptics for tests
vi.mock("use-haptic", () => ({
    useHaptic: () => ({ triggerHaptic: vi.fn() }),
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
