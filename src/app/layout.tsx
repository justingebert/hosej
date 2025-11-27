import { AppWrapper } from "../components/Warppers/AppWrapper";
import { ThemeColorMeta } from "@/components/Warppers/ThemeColorVieport";
import { Toaster } from "@/components/ui/toaster";
import { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import SWRErrorHandlingProvider from "@/components/Warppers/SWRErrorHandelingProvider";

export const metadata: Metadata = {
    title: "HoseJ",
    description: "HoseJ",
    manifest: "manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/AppIcons/new/web/apple-touch-icon.png" />
                <link rel="icon" href="/AppIcons/new/web/favicon.ico" sizes="any" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <ThemeColorMeta />
            </head>
            <body>
                <SWRErrorHandlingProvider>
                    <div className="p-6 h-[100dvh]">
                        <AppWrapper>{children}</AppWrapper>
                    </div>
                    <Toaster />
                    <Analytics />
                    <SpeedInsights />
                </SWRErrorHandlingProvider>
            </body>
        </html>
    );
}
