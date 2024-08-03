import { sendNotification } from "@/utils/sendNotification";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { title, body } = await req.json();

  try {
    const result = await sendNotification(title, body);
    return NextResponse.json({ message: `${result.successCount} messages were sent successfully` });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}