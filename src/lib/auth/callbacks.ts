import type { Account, Session, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import dbConnect from "@/db/dbConnect";
import User from "@/db/models/User";

/**
 * CredentialsProvider authorize function for device-based auth.
 * Looks up a user by deviceId and returns a NextAuth-compatible user object.
 */
export async function authorizeDevice(
    credentials: Record<"deviceId", string> | undefined
): Promise<NextAuthUser | null> {
    await dbConnect();
    const deviceId = credentials?.deviceId;
    if (!deviceId) {
        return null;
    }
    const userDoc = await User.findOne({ deviceId }).lean();
    if (!userDoc) {
        return null;
    }
    return { ...userDoc, id: userDoc._id.toString() } as NextAuthUser;
}

/**
 * JWT callback — resolves userId on sign-in, caches user fields in the token,
 * and refreshes from DB when update() is called.
 */
export async function jwtCallback({
    token,
    user,
    account,
    trigger,
}: {
    token: JWT;
    user?: NextAuthUser;
    account?: Account | null;
    trigger?: "signIn" | "signUp" | "update";
}): Promise<JWT> {
    // On sign-in: resolve userId and cache user fields in the token
    if (account?.provider === "google") {
        await dbConnect();
        const existingUser = await User.findOne({ googleId: account.providerAccountId });
        if (!existingUser) {
            const newUser = new User({
                googleId: account.providerAccountId,
                googleConnected: true,
                username: user?.name || "",
            });
            await newUser.save();
            token.userId = newUser._id.toString();
            token.username = newUser.username;
            token.googleConnected = true;
            token.groups = [];
            token.createdAt = String(newUser.createdAt);
        } else {
            token.userId = existingUser._id.toString();
            token.username = existingUser.username;
            token.googleConnected = existingUser.googleConnected;
            token.groups = existingUser.groups.map(String);
            token.createdAt = String(existingUser.createdAt);
        }
    } else if (user) {
        // Device credentials sign-in — user object comes from authorizeDevice
        const u = user as NextAuthUser & {
            _id: { toString(): string };
            username: string;
            googleConnected?: boolean;
            groups?: string[];
            createdAt?: string;
        };
        token.userId = u._id.toString();
        token.username = u.username;
        token.googleConnected = u.googleConnected ?? false;
        token.groups = u.groups ?? [];
        token.createdAt = u.createdAt ?? "";
    }

    // Refresh user data when update() is called or when token is missing fields
    // (e.g. JWT created before auth refactor that lacks username/createdAt/etc.)
    const isStaleToken = token.userId && !token.createdAt;
    if ((trigger === "update" || isStaleToken) && token.userId) {
        await dbConnect();
        const freshUser = await User.findById(token.userId).select("-googleId -deviceId").lean();
        if (freshUser) {
            token.username = freshUser.username;
            token.googleConnected = freshUser.googleConnected;
            token.groups = freshUser.groups.map(String);
            token.createdAt = String(freshUser.createdAt);
        }
    }

    return token;
}

/**
 * Session callback — builds session.user from cached token fields (zero DB queries).
 */
export async function sessionCallback({ session, token }: { session: Session; token: JWT }) {
    session.userId = token.userId;
    session.user = {
        _id: token.userId,
        username: token.username,
        googleConnected: token.googleConnected,
        groups: token.groups,
        createdAt: token.createdAt,
    };
    return session;
}
