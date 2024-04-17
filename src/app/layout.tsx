import type { Metadata } from "next";
import { UserProvider } from "../context/UserContext";
import "./globals.css";
import { AppWrapper } from "../components/AppWrapper";
import { Analytics } from "@vercel/analytics/react"

export const metadata = {
  manifest: "manifest.json",
  title: "HoseJ",
  description: "HoseJ",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
        <body>
          <AppWrapper>{children}</AppWrapper>
          <Analytics />
        </body>
    </html>
    
  );
}
