import type { Metadata } from "next";
import { UserProvider } from "../context/UserContext";
import "./globals.css";
import { AppWrapper } from "../components/AppWrapper";
import { Analytics } from "@vercel/analytics/react"
import { ThemeProvider } from "@/components/theme-provider"



export let metadata:any = {
  title: "HoseJ",
  description: "HoseJ",
  manifest: 'manifest.json'
};

/* if (process.env.NODE_ENV !== "development"){
  metadata.manifest = "manifest.json";
} */


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
        <head>
        <link rel="manifest" href="/manifest.json" id="manifest" />
        <link rel="icon" href="AppIcons/favicon.ico" />
        </head>
        <body>
          <AppWrapper>
            {children}
            </AppWrapper>
          <Analytics />
        </body>
    </html>
    
  );
}
