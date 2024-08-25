import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/dbConnect';
import User from '@/db/models/user';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Device ID',
      credentials: {
        deviceId: { label: 'Device ID', type: 'text' },
      },
      async authorize(credentials) {
        await dbConnect();
        const { deviceId } = credentials!;

        if (!deviceId) {
          throw new Error('No device ID provided');
        }

        const user = await User.findOne({ deviceId });
        if (user) {
          return user;
        } else {
          throw new Error('Invalid Device ID');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === 'google') {
        await dbConnect();
        const existingUser = await User.findOne({ googleId: account.providerAccountId });

        if (!existingUser) {
          const newUser = new User({
            googleId: account.providerAccountId,
            email: user.email,
            username: user.name || '',
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
    async session({ session, token }) {
      session.userId = token.userId;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
