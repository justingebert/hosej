import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/dbConnect';
import User from '@/db/models/user';

export const authOptions = 
{
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
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
        console.log(deviceId)
        const user = await User.findOne({ deviceId: deviceId });
        if (user) {
          return user;
        } else {
          throw new Error('Invalid Device ID');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }:any) {
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
    async session({ session, token }:any) {
      session.userId = token.userId;
      await dbConnect();
      const user = await User.findById(token.userId);
      
      session.user = user; // Include the full user object in the session
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
}