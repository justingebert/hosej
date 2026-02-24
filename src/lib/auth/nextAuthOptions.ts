import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions } from "next-auth";
import { authorizeDevice, jwtCallback, sessionCallback } from "@/lib/auth/callbacks";
import { env } from "@/env";

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
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
    secret: env.NEXTAUTH_SECRET,
};
