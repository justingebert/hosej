import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import SpotifyProvider from "next-auth/providers/spotify";
import dbConnect from '@/lib/dbConnect';
import User from '@/db/models/user';

export const authOptions = 
{
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
      }
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
        const user = await User.findOne({ deviceId: deviceId });
        if (user) {
          return user;
        } else {
          throw new Error('Invalid Device ID');
        }
      },
    }),
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: {
          scope: "playlist-modify-public playlist-modify-private",
          userId: ""
        },
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
            googleConnected: true,
            username: user.name || '',
          });
          await newUser.save();
          token.userId = newUser._id.toString();
        } else {
          token.userId = existingUser._id.toString();
        }
      } else if(account?.provider === "spotify"){
        await dbConnect();
        const existingUser = await User.findOne({ spotifyUsername: account.providerAccountId });
        if (!existingUser) {
          const newUser = new User({
            spotifyUsername: account.providerAccountId,
            spotifyAccessToken: account.access_token,
            spotifyRefreshToken: account.refresh_token,
            spotifyTokenExpiresAt: account.expires_at,
            spotifyConnected: true,
            username: user.name || '',
          });
          await newUser.save();
          token.userId = newUser._id.toString();
        } else {
          token.userId = existingUser._id.toString();
        }
      }else if (user) {
        token.userId = user._id.toString();
        
      }
      return token;
    },
    async session({ session, token }:any) {
      session.userId = token.userId;
      await dbConnect();
      const user = await User.findById(token.userId).select('-googleId -spotifyAccessToken -spotifyRefreshToken -spotifyTokenExpiresAt -spotifyUsername -deviceId');
      
      session.user = user; // Include the full user object in the session
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
}