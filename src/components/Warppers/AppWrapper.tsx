"use client";

import { useEffect, type ReactNode } from "react";
import { ThemeProvider } from "@/components/Warppers/theme-provider"
import { TokenProvider } from "./TokenProvider";
import { SessionProvider } from "next-auth/react";


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
