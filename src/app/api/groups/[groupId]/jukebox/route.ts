import dbConnect from "@/lib/dbConnect";
import { isUserInGroup } from "@/lib/groupAuth";
import { NextRequest, NextResponse } from "next/server";
import Jukebox from "@/db/models/Jukebox";
import { ISong } from "@/types/models/jukebox";
import User from "@/db/models/user";
import { AuthedContext, withAuthAndErrors } from "@/lib/api/withAuth";
import { IUser } from "@/types/models/user";
import { IRating } from "@/types/models/jukebox";

export const revalidate = 0;

export const GET = withAuthAndErrors(
    async (
        req: NextRequest,
        {params, userId}: AuthedContext<{ params: { groupId: string } }>
    ) => {
        const {groupId} = params;
        const url = new URL(req.url);
        const isActive = url.searchParams.get("isActive") === "true";
        const processed = url.searchParams.get("processed") === "true"; //process numbers of jukebox
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const limit = parseInt(url.searchParams.get("limit") || "10", 10);

        await dbConnect();

        await isUserInGroup(userId, groupId);

        const query: any = {groupId};
        if (url.searchParams.has("isActive")) {
            query.active = isActive;
        }

        // Pagination options
        const skip = (page - 1) * limit;

        let jukeboxes = await Jukebox.find(query)
                .sort({createdAt: -1})
                .skip(skip)
                .limit(limit)
                .populate
            <{songs: (ISong & {submittedBy: IUser, ratings: (IRating & {userId: IUser})[]})[]}>
            ([{
                    path: "songs.submittedBy",
                    model: User,
                    select: "_id username",
                },
                    {
                        path: "songs.ratings.userId",
                        model: User,
                        select: "_id username",
                    }]
            ).lean();

        const total = await Jukebox.countDocuments(query);

        //TODO refactor this - this is terrible
        if (processed) {
            jukeboxes = jukeboxes.map((jukebox) => {
                const userHasSubmitted = jukebox.songs.some(
                    (song) => String(song.submittedBy?._id) === String(userId)
                );

                return {
                    ...jukebox,
                    userHasSubmitted,
                    songs: jukebox.songs
                        .map((song) => {
                            // First, sort the ratings array for each song (highest first)
                            const sortedRatings = [...song.ratings].sort(
                                (a, b) => b.rating - a.rating
                            );

                            // Compute average rating, if any
                            const avgRating =
                                sortedRatings.length > 0
                                    ? sortedRatings.reduce(
                                    (acc, rating) => acc + rating.rating,
                                    0
                                ) / sortedRatings.length
                                    : null;

                            // Determine whether the user has rated this song
                            const hasRated = sortedRatings.some(
                                (rating) => String(rating.userId._id) === String(userId)
                            );

                            return {
                                ...song,
                                ratings: sortedRatings,
                                avgRating,
                                // For sorting purposes, treat songs submitted by the user as if they are rated
                                userHasRated:
                                    String(song.submittedBy?._id) === String(userId)
                                        ? true
                                        : hasRated,
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
    }
);
