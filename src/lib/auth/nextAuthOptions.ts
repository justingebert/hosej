import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions } from "next-auth";
import { authorizeDevice, jwtCallback, sessionCallback } from "@/lib/auth/callbacks";

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            httpOptions: {
                timeout: 10000,
            },
        }),
        CredentialsProvider({
            name: "Device ID",
            credentials: {
                deviceId: { label: "Device ID", type: "text" },
            },
            authorize: authorizeDevice,
        }),
    ],
    callbacks: {
        jwt: jwtCallback,
        session: sessionCallback,
    },
    pages: {
        signIn: "/",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
