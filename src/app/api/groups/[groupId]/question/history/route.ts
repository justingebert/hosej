import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse, type NextRequest } from "next/server";

export const revalidate = 0;
export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get("limit") as string;
    const offset = searchParams.get("offset") as string;

    const questions = await Question.find({
      groupId: params.groupId,
      used: true,
      active: false,
      category: "Daily",
    })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    if (!questions) {
      return NextResponse.json({ message: "No questions available" });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error getting question history", error);
    return NextResponse.json({ message: "Internal Sever Error" }, { status: 500 });
  }
}
