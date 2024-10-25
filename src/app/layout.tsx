// app/layout.tsx (server-side)
import { AppWrapper } from "../components/Warppers/AppWrapper";
import { ThemeColorMeta } from "@/components/Warppers/ThemeColorVieport";
import { Toaster } from "@/components/ui/toaster";
import { Metadata } from "next";
import "./globals.css";
import PageTransitionWrapper from "@/components/Warppers/PageTransitionWrapper"; // Client-side wrapper for transitions

export const metadata: Metadata = {
  title: "HoseJ",
  description: "HoseJ",
  manifest: "manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="AppIcons/favicon.ico" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
        <ThemeColorMeta />
      </head>
      <body>
        <div className="p-6 h-[100dvh]">
          <AppWrapper>
           {/*  <PageTransitionWrapper>{children}</PageTransitionWrapper> */}
           {children}
          </AppWrapper>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
