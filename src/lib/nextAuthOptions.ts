import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions, User as NextAuthUser } from "next-auth";
import dbConnect from "@/db/dbConnect";
import User from "@/db/models/User";

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
            async authorize(credentials): Promise<NextAuthUser | null> {
                await dbConnect();
                const deviceId = credentials?.deviceId;
                if (!deviceId) {
                    return null;
                }
                const userDoc = await User.findOne({ deviceId }).lean();
                if (!userDoc) {
                    return null;
                }
                // NextAuth requires an `id` field on the returned user
                return { ...userDoc, id: userDoc._id.toString() } as NextAuthUser;
            },
        }),
    ],
    callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async jwt({ token, user, account, trigger }: any) {
            // On sign-in: resolve userId and cache user fields in the token
            if (account?.provider === "google") {
                await dbConnect();
                const existingUser = await User.findOne({ googleId: account.providerAccountId });
                if (!existingUser) {
                    const newUser = new User({
                        googleId: account.providerAccountId,
                        googleConnected: true,
                        username: user.name || "",
                    });
                    await newUser.save();
                    token.userId = newUser._id.toString();
                    token.username = newUser.username;
                    token.googleConnected = true;
                    token.groups = [];
                    token.createdAt = newUser.createdAt;
                } else {
                    token.userId = existingUser._id.toString();
                    token.username = existingUser.username;
                    token.googleConnected = existingUser.googleConnected;
                    token.groups = existingUser.groups;
                    token.createdAt = existingUser.createdAt;
                }
            } else if (user) {
                // Device credentials sign-in
                token.userId = user._id.toString();
                token.username = user.username;
                token.googleConnected = user.googleConnected ?? false;
                token.groups = user.groups ?? [];
                token.createdAt = user.createdAt;
            }

            // Refresh user data when update() is called (e.g. after profile changes)
            if (trigger === "update" && token.userId) {
                await dbConnect();
                const freshUser = await User.findById(token.userId)
                    .select("-googleId -deviceId")
                    .lean();
                if (freshUser) {
                    token.username = freshUser.username;
                    token.googleConnected = freshUser.googleConnected;
                    token.groups = freshUser.groups;
                    token.createdAt = freshUser.createdAt;
                }
            }

            return token;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async session({ session, token }: any) {
            session.userId = token.userId;
            // Build session.user from cached token fields — zero DB queries
            session.user = {
                _id: token.userId,
                username: token.username,
                googleConnected: token.googleConnected,
                groups: token.groups,
                createdAt: token.createdAt,
            };
            return session;
        },
    },
    pages: {
        signIn: "/",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
