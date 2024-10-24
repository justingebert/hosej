import dbConnect from "@/lib/dbConnect";
import Question from "@/db/models/Question";
import { NextResponse, type NextRequest } from "next/server";
import { isUserInGroup } from "@/lib/groupAuth";

export const revalidate = 0;
export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const userId = req.headers.get('x-user-id') as string;

  try {
    const authCheck = await isUserInGroup(userId, groupId);
    if (!authCheck.isAuthorized) {
      return NextResponse.json({ message: authCheck.message }, { status: authCheck.status });
    }

    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get("limit") as string;
    const offset = searchParams.get("offset") as string;

    const questions = await Question.find({
      groupId: groupId,
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
