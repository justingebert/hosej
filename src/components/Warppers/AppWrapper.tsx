"use client";

import { useEffect, type ReactNode } from "react";
import { UserProvider, useUser } from "../UserContext";
import { ThemeProvider } from "@/components/Warppers/theme-provider"
import { TokenProvider } from "./TokenProvider";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "../AuthContext";



export const AppWrapper = ({ children }: { children: ReactNode }) => {

  return (
    <SessionProvider>
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
    </SessionProvider>
  );
};
