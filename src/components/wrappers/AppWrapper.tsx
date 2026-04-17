"use client";

import { type ReactNode } from "react";
import { TokenProvider } from "./TokenProvider";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./ThemeProvider";
import { AnnouncementGate } from "@/components/announcements/AnnouncementGate";

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
                    <AnnouncementGate />
                </ThemeProvider>
            </TokenProvider>
        </SessionProvider>
    );
};
