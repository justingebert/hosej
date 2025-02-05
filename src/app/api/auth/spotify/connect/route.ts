import Group from "@/db/models/Group";
import User from "@/db/models/user";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); 
    const { userId, spotifyUserId } = body;
    if (!userId || !spotifyUserId) {
      return NextResponse.json({message: 'No userId provided' }, { status: 400 });
    }
    const session = await getServerSession(authOptions);
    if(session.userId !== spotifyUserId) {
      return NextResponse.json({message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const spotifyUser = await User.findById(spotifyUserId);
    if (!spotifyUser) {
      return NextResponse.json({ message: 'Spotify user not found' }, { status: 404 });
    }

    const originalUser = await User.findById(userId);
    if (!originalUser) {
      return NextResponse.json({message: 'User with deviceId not found' }, { status: 404 });
    }

    const spotifyAccessToken = spotifyUser.spotifyAccessToken;
    const spotifyRefreshToken = spotifyUser.spotifyRefreshToken;
    const spotifyTokenExpiresAt = spotifyUser.spotifyTokenExpiresAt;
    const spotifyUsername = spotifyUser.spotifyUsername;
    
    await User.findByIdAndDelete(spotifyUserId);

    originalUser.spotifyAccessToken = spotifyAccessToken;
    originalUser.spotifyRefreshToken = spotifyRefreshToken;
    originalUser.spotifyTokenExpiresAt = spotifyTokenExpiresAt;
    originalUser.spotifyUsername = spotifyUsername;
    originalUser.spotifyConnected = true;
    await originalUser.save();

    await Group.updateMany(
      { admin: originalUser._id },
      { $set: { spotifyConneceted: true } }
    );
    

    const provider = originalUser.googleConnected ? 'google' : 'credentials';
    
    return NextResponse.json({ message: 'Spotify account linked successfully.', provider: provider}, { status: 200 });

  } catch (error) {
    console.error('Error merging accounts:', error);
    return NextResponse.json({message: 'Internal Server Error' }, { status: 500 });
  }
}
