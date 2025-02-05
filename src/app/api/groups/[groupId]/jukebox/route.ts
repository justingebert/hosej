import dbConnect from "@/lib/dbConnect";
import { isUserInGroup } from "@/lib/groupAuth";
import { NextResponse } from "next/server";
import Jukebox, { ISong } from "@/db/models/Jukebox";
import { IUser } from "@/db/models/user";

export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const userId = req.headers.get("x-user-id") as string;
  const url = new URL(req.url);
  const isActive = url.searchParams.get("isActive") === "true"; 
  const processed = url.searchParams.get("processed") === "true"; //process numbers of jukebox
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);

  try {
    // Auth check
    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
      return NextResponse.json(
        { message: authCheck.message },
        { status: authCheck.status }
      );
    }

    await dbConnect();

    const query: any = { groupId };
    if (url.searchParams.has("isActive")) {
      query.active = isActive;
    }

    // Pagination options
    const skip = (page - 1) * limit;

    let jukeboxes = await Jukebox.find(query)
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit)
      .populate({
        path: "songs.submittedBy", 
        model: "User",
        select: "_id username",
      })
      .populate({
        path: "songs.ratings.userId",
        model: "User", 
        select: "_id username",
      })
      .lean();

      // 


    const total = await Jukebox.countDocuments(query);

    if (processed) {
      jukeboxes = jukeboxes.map((jukebox) => {
        const userHasSubmitted = jukebox.songs.some(
          (song: ISong) =>
            String((song.submittedBy as IUser)._id) === String(userId)
        );
    
        return {
          ...jukebox,
          userHasSubmitted, // Moved to the top level
          songs: jukebox.songs
            .map((song: ISong) => {
              // Sort the ratings array (highest rating first)
              const sortedRatings = [...song.ratings].sort((a, b) => b.rating - a.rating);
    
              const avgRating =
                sortedRatings.length > 0
                  ? sortedRatings.reduce((acc, rating) => acc + rating.rating, 0) / sortedRatings.length
                  : null;
    
              return {
                ...song,
                ratings: sortedRatings, // Sorted ratings array
                avgRating, // Add average rating
                userHasRated: sortedRatings.some(
                  (rating) => String((rating.userId as IUser)._id) === String(userId)
                ), // Add user rating status
              };
            })
            .sort((a:any, b:any) => {
              if (a.avgRating === null) return 1;
              if (b.avgRating === null) return -1;
              return b.avgRating - a.avgRating;
            }),
        };
      });
    }


    return NextResponse.json({
      data: jukeboxes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
