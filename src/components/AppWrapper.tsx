"use client";

import type { ReactNode } from "react";
import { UserProvider } from "../context/UserContext";

export const AppWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
};