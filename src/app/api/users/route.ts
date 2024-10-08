import { NextResponse } from 'next/server'
import dbConnect from "@/lib/dbConnect";
import User from "@/db/models/user";

export const revalidate = 0

//get all users
export async function GET(req: Request, res: NextResponse) {
  await dbConnect();
  const users = await User.find({});

  return NextResponse.json(users);
}

//create user
export async function POST(req: any, res: NextResponse) {
  await dbConnect();

  const data = await req.json();
  const username = data.username;
  console.log('username:', username);
  if (!username) {
    return NextResponse.json({ message: "Username is required" });
  }
  try {
    const newUser = new User({ username: username });
    await newUser.save();
    return NextResponse.json(newUser);
  } catch (error) {
    return NextResponse.json({ message: "Error creating user", error });
  }
}
