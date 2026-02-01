"use client";

import { type ReactNode } from "react";
import { TokenProvider } from "./TokenProvider";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./ThemeProvider";

export const AppWrapper = ({ children }: { children: ReactNode }) => {
    return (
        <SessionProvider>
            <TokenProvider>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                </ThemeProvider>
            </TokenProvider>
        </SessionProvider>
    );
};
