import type { Metadata } from "next";
import { UserProvider } from "../context/UserContext";
import "./globals.css";
import { AppWrapper } from "../components/AppWrapper";
import { Analytics } from "@vercel/analytics/react"

export let metadata:any = {
  title: "HoseJ",
  description: "HoseJ",
};

if (process.env.NODE_ENV !== "development"){
  metadata.manifest = "manifest.json";
}


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
