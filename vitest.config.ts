import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/test/setup.ts"],
        globalSetup: ["./src/test/globalSetup.ts"],
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        exclude: ["node_modules", ".next"],
        testTimeout: 15000,
        pool: "forks",
        fileParallelism: false,
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            exclude: ["node_modules/", ".next/", "src/test/"],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
