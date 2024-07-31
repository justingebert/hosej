"use client";

import { useEffect, type ReactNode } from "react";
import { UserProvider, useUser } from "./UserContext";
import { ThemeProvider } from "@/components/theme-provider"
import { TokenProvider } from "./TokenProvider";



export const AppWrapper = ({ children }: { children: ReactNode }) => {

  return (
    <UserProvider>
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
    </UserProvider>
  );
};