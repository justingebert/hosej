import { NextResponse } from 'next/server'
import dbConnect from "@/db/dbConnect";
import user from "@/db/models/user";

export const revalidate = 0

export async function GET(req: Request, res: NextResponse) {
  await dbConnect();
  const users = await user.find({});
  return NextResponse.json(users);
}

export async function POST(req: any, res: NextResponse) {
  await dbConnect();

  const data = await req.json();
  const username = data.username;
  console.log('username:', username);
  if (!username) {
    return NextResponse.json({ message: "Username is required" });
  }

  try {
    const newUser = new user({ username: username });
    await newUser.save();
    return NextResponse.json(newUser);
  } catch (error) {
    return NextResponse.json({ message: "Error creating user", error });
  }
}
