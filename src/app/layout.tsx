import type { Metadata } from "next";
import "./globals.css";
import { AppWrapper } from "../components/AppWrapper";
/* import { Analytics } from "@vercel/analytics/react" */
import { ThemeProvider } from "@/components/theme-provider"
/* import { SpeedInsights } from "@vercel/speed-insights/next"
 */

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
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
        </head>
        <body className="m-6">
          <AppWrapper>
            {children}
            </AppWrapper>
          {/* <Analytics /> */}
         {/*  <SpeedInsights /> */}
        </body>
    </html>
    
  );
}
