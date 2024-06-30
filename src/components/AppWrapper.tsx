"use client";

import type { ReactNode } from "react";
import { UserProvider } from "./UserContext";
import { ThemeProvider } from "@/components/theme-provider"

export const AppWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <UserProvider>
      <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          > 
      {children}
      </ThemeProvider>
    </UserProvider>
  );
};