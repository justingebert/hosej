import dbConnect from "@/db/dbConnect";
import { isUserInGroup } from "@/lib/services/admin";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import Jukebox from "@/db/models/Jukebox";
import type { IJukebox, IRating, ISong } from "@/types/models/jukebox";
import User from "@/db/models/User";
import type { AuthedContext } from "@/lib/api/withAuth";
import { withAuthAndErrors } from "@/lib/api/withAuth";
import type { IUser } from "@/types/models/user";
import Group from "@/db/models/Group";

export const revalidate = 0;

function buildJukeboxQuery(groupId: string, url: URL) {
    const isActive = url.searchParams.get("isActive") === "true";

    const query: Partial<IJukebox> = { groupId: groupId };
    if (url.searchParams.has("isActive")) {
        query.active = isActive;
    }
    return query;
}

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        { params, userId }: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const { groupId } = params;
        const url = new URL(req.url);

        await dbConnect();

        await isUserInGroup(userId, groupId);

        const group = await Group.findById(groupId).orFail();

        const query = buildJukeboxQuery(groupId, url);

        const jukeboxes = await Jukebox.find(query)
            .sort({ createdAt: -1 })
            .limit(group.features.jukebox.settings.concurrent.length)
            .populate<{
                songs: [ISong & { submittedBy: IUser; ratings: [IRating & { userId: IUser }] }];
            }>([
                {
                    path: "songs.submittedBy",
                    model: User,
                    select: "_id username",
                },
                {
                    path: "songs.ratings.userId",
                    model: User,
                    select: "_id username",
                },
            ])
            .lean();

        const processedJukeboxes = jukeboxes.map((jukebox) => {
            const userHasSubmitted = jukebox.songs.some(
                (song) => String(song.submittedBy?._id) === userId
            );

            const songs = jukebox.songs
                .map((song) => {
                    // First, sort the ratings array for each song (highest first)
                    const sortedRatings = [...song.ratings].sort((a, b) => b.rating - a.rating);

                    // Compute average rating, if any
                    const avgRating =
                        sortedRatings.length > 0
                            ? sortedRatings.reduce((acc, rating) => acc + rating.rating, 0) /
                              sortedRatings.length
                            : null;

                    // Determine whether the user has rated this song
                    const userHasRated = sortedRatings.some(
                        (rating) => String(rating.userId._id) === userId
                    );

                    return {
                        ...song,
                        ratings: sortedRatings,
                        avgRating,
                        // For sorting purposes, treat songs submitted by the user as if they are rated
                        userHasRated:
                            String(song.submittedBy?._id) === userId ? true : userHasRated,
                    };
                })
                .sort((a: any, b: any) => {
                    // First, songs NOT rated by the current user come first.
                    if (!a.userHasRated && b.userHasRated) return -1;
                    if (a.userHasRated && !b.userHasRated) return 1;
                    // Then, for songs in the same category, sort by average rating (highest first)
                    if (a.avgRating === null && b.avgRating !== null) return 1;
                    if (a.avgRating !== null && b.avgRating === null) return -1;
                    if (a.avgRating === null && b.avgRating === null) return 0;
                    return b.avgRating - a.avgRating;
                });

            return {
                ...jukebox,
                songs: songs,
                userHasSubmitted,
            };
        });

        return NextResponse.json(processedJukeboxes);
    }
);
