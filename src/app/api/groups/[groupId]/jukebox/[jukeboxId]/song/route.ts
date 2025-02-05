import dbConnect from "@/lib/dbConnect";
import { isUserInGroup } from "@/lib/groupAuth";
import Jukebox from "@/db/models/Jukebox";
import { NextResponse } from "next/server";

export const revalidate = 0;

export async function POST(req: Request, { params }: { params: { groupId: string, jukeboxId: string} }) {
  const { groupId, jukeboxId } = params;
  const userId = req.headers.get("x-user-id") as string;

  try {
    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
      return NextResponse.json(
        { message: authCheck.message },
        { status: authCheck.status }
      );
    }

    
    const body = await req.json();
    const { spotifyTrackId, title, artist, album, coverImageUrl } = body;

    if (!spotifyTrackId || !title || !artist) {
      return NextResponse.json(
        { message: "jukeboxId, spotifyTrackId, title, and artist are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    
    const jukebox = await Jukebox.findOne({ _id: jukeboxId, groupId, active: true });

    if (!jukebox) {
      return NextResponse.json(
        { message: "Jukebox not found or is not active" },
        { status: 404 }
      );
    }

    jukebox.songs.push({
      spotifyTrackId,
      title,
      artist,
      album,
      coverImageUrl,
      submittedBy: userId,
      ratings: [],
    });

    await jukebox.save();

    return NextResponse.json({ message: "Song added to jukebox", data: jukebox }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
