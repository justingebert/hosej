'use client'

import type { Metadata } from "next";
import { UserProvider } from "../context/UserContext";
import "./globals.css";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
     {children}
    </UserProvider>
  );
}
