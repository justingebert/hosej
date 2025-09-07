// import Group from "@/db/models/Group";
// import User from "@/db/models/user";
// import { authOptions } from "@/lib/authOptions";
// import dbConnect from "@/lib/dbConnect";
// import { getServerSession } from "next-auth";
// import { NextRequest } from "next/server";
//
// export async function DELETE(req:NextRequest) {
//   const session = await getServerSession(authOptions);
//   await dbConnect();
//
//   if (!session ) {
//     return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 403 });
//   }
//
//   const adminUser = await User.findById(session.userId);
//   if (adminUser) {
//     adminUser.spotifyUsername = undefined;
//     adminUser.spotifyAccessToken = undefined;
//     adminUser.spotifyRefreshToken = undefined;
//     adminUser.spotifyTokenExpiresAt = undefined;
//     adminUser.spotifyConnected = false;
//     await adminUser.save();
//
//     await Group.updateMany(
//       { admin: adminUser._id },
//       { $set: { spotifyConneceted: false } }
//     );
//   }
//
//
//
//   return new Response(JSON.stringify({ message: "Spotify disconnected successfully" }), { status: 200 });
// }
