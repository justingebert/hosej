import type { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        userId: string;
        user: DefaultSession["user"] & {
            _id: string;
            username: string;
            googleConnected: boolean;
            groups: string[];
            createdAt: string;
            needsNameSetup?: boolean;
            onboardingCompleted?: boolean;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        userId: string;
        username: string;
        googleConnected: boolean;
        groups: string[];
        createdAt: string;
        needsNameSetup?: boolean;
        onboardingCompleted?: boolean;
    }
}
