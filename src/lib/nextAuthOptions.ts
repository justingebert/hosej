import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/db/dbConnect";
import User from "@/db/models/user";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            /* authorization:{
                  params: {
                    access_type: 'offline',
                    prompt: 'consent',
                  }
                } */
            httpOptions: {
                timeout: 10000,
            },
        }),
        CredentialsProvider({
            name: "Device ID",
            credentials: {
                deviceId: {label: "Device ID", type: "text"},
            },
            //@ts-ignore
            async authorize(credentials) {
                await dbConnect();
                const {deviceId} = credentials!;
                if (!deviceId) {
                    return null;
                }
                const userDoc = await User.findOne({deviceId: deviceId}).lean();
                if (!userDoc) {
                    return null;
                }
                return userDoc;
            },
        }),
    ],
    callbacks: {
        async jwt({token, user, account}: any) {
            if (account?.provider === "google") {
                await dbConnect();
                const existingUser = await User.findOne({googleId: account.providerAccountId});
                if (!existingUser) {
                    const newUser = new User({
                        googleId: account.providerAccountId,
                        googleConnected: true,
                        username: user.name || "",
                    });
                    await newUser.save();
                    token.userId = newUser._id.toString();
                } else {
                    token.userId = existingUser._id.toString();
                }
            } else if (user) {
                token.userId = user._id.toString();
            }
            return token;
        },
        async session({session, token}: any) {
            session.userId = token.userId;
            await dbConnect();
            //exclude googleId and deviceId from the session
            session.user = await User.findById(token.userId).select("-googleId -deviceId"); // Include the full user object in the session -- this is bad , needs to be fixed
            return session;
        },
    },
    pages: {
        signIn: "/",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
