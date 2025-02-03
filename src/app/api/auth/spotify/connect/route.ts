import User from "@/db/models/user";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req:NextRequest) {
  const session = await getServerSession(authOptions);
  await dbConnect();

  if (!session ) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 403 });
  }

  const adminUser = await User.findById(session.userId);
  if (adminUser) {
    adminUser.spotifyAccessToken = undefined;
    adminUser.spotifyRefreshToken = undefined;
    adminUser.spotifyTokenExpiresAt = undefined;
    await adminUser.save();
  }

  return new Response(JSON.stringify({ message: "Spotify disconnected successfully" }), { status: 200 });
}

