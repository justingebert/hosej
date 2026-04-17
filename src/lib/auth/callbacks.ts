import type { Account, Session, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { cookies } from "next/headers";
import dbConnect from "@/db/dbConnect";
import User from "@/db/models/User";
import { CONNECT_TOKEN_COOKIE } from "@/lib/auth/connectToken";

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
            // Check if a device user is linking their Google account (connect flow).
            // The connect token is issued to a specific browser via an httpOnly
            // cookie by POST /api/users/google/connect-token. We require an exact
            // match between the cookie token and the user's stored connectToken —
            // without this binding, any concurrent Google sign-in could be merged
            // into a victim who happens to have a pending link in progress.
            let cookieToken: string | undefined;
            try {
                const cookieStore = await cookies();
                cookieToken = cookieStore.get(CONNECT_TOKEN_COOKIE)?.value;
            } catch {
                // cookies() may be unavailable outside a request scope — treat
                // as no cookie present and fall through to fresh-signup handling.
            }

            const deviceUser = cookieToken
                ? await User.findOne({
                      connectToken: cookieToken,
                      connectTokenExpiresAt: { $gt: new Date() },
                  })
                : null;

            if (deviceUser) {
                // Connect flow: merge Google ID into the existing device user
                deviceUser.googleId = account.providerAccountId;
                deviceUser.googleConnected = true;
                deviceUser.deviceId = undefined;
                deviceUser.connectToken = undefined;
                deviceUser.connectTokenExpiresAt = undefined;
                await deviceUser.save();

                // Best-effort cookie clear. The connect token is already
                // single-use (cleared above), so even if the cookie lingers
                // until its 5-minute maxAge expiry it can no longer be matched.
                try {
                    const cookieStore = await cookies();
                    cookieStore.delete(CONNECT_TOKEN_COOKIE);
                } catch {
                    /* no-op — see comment above */
                }

                token.userId = deviceUser._id.toString();
                token.username = deviceUser.username;
                token.googleConnected = true;
                token.groups = deviceUser.groups.map(String);
                token.createdAt = String(deviceUser.createdAt);
                token.needsNameSetup = false;
                token.onboardingCompleted = deviceUser.onboardingCompleted ?? true;
                token.announcementsSeen = deviceUser.announcementsSeen ?? [];
            } else {
                // Fresh Google signup — create a new user
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
                token.needsNameSetup = true;
                token.onboardingCompleted = false;
                token.announcementsSeen = [];
            }
        } else {
            token.userId = existingUser._id.toString();
            token.username = existingUser.username;
            token.googleConnected = existingUser.googleConnected;
            token.groups = existingUser.groups.map(String);
            token.createdAt = String(existingUser.createdAt);
            token.needsNameSetup = false;
            token.onboardingCompleted = existingUser.onboardingCompleted ?? true;
            token.announcementsSeen = existingUser.announcementsSeen ?? [];
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
        token.onboardingCompleted =
            (u as unknown as { onboardingCompleted?: boolean }).onboardingCompleted ?? true;
        token.announcementsSeen =
            (u as unknown as { announcementsSeen?: string[] }).announcementsSeen ?? [];
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
            token.needsNameSetup = false;
            token.onboardingCompleted = freshUser.onboardingCompleted ?? true;
            token.announcementsSeen = freshUser.announcementsSeen ?? [];
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
        needsNameSetup: token.needsNameSetup,
        onboardingCompleted: token.onboardingCompleted,
        announcementsSeen: token.announcementsSeen ?? [],
    };
    return session;
}
