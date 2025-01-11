import dbConnect from "@/lib/dbConnect";
import { isUserInGroup } from "@/lib/groupAuth";
import { NextResponse } from "next/server";
import Jukebox from "@/db/models/Jukebox";

export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const userId = req.headers.get("x-user-id") as string;
  const url = new URL(req.url);
  const isActive = url.searchParams.get("isActive") === "true"; // Optional filter for active jukeboxes
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
      query.isActive = isActive;
    }

    // Pagination options
    const skip = (page - 1) * limit;

    const jukeboxes = await Jukebox.find(query)
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit)
      .lean();


    const total = await Jukebox.countDocuments(query);

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
