import dbConnect from "@/db/dbConnect";
import Jukebox from "@/db/models/Jukebox";
import Chat from "@/db/models/Chat";
import User from "@/db/models/User";
import Group from "@/db/models/Group";
import type { IJukebox, IRating, ISong, createSong } from "@/types/models/jukebox";
import type { IUser } from "@/types/models/user";
import type { IGroup } from "@/types/models/group";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { sendNotification } from "@/lib/sendNotification";
import { createChatForEntity } from "@/lib/services/chat";
import { EntityModel } from "@/types/models/chat";

// ─── Query helpers ───────────────────────────────────────────

function processSongs(
    songs: (ISong & { submittedBy: IUser; ratings: (IRating & { userId: IUser })[] })[],
    userId: string
) {
    return songs
        .map((song) => {
            const sortedRatings = [...song.ratings].sort((a, b) => b.rating - a.rating);

            const avgRating =
                sortedRatings.length > 0
                    ? sortedRatings.reduce((acc, r) => acc + r.rating, 0) / sortedRatings.length
                    : null;

            const userHasRated = sortedRatings.some(
                (rating) => String(rating.userId._id) === userId
            );

            return {
                ...song,
                ratings: sortedRatings,
                avgRating,
                userHasRated: String(song.submittedBy?._id) === userId ? true : userHasRated,
            };
        })
        .sort((a, b) => {
            if (!a.userHasRated && b.userHasRated) return -1;
            if (a.userHasRated && !b.userHasRated) return 1;
            if (a.avgRating === null && b.avgRating !== null) return 1;
            if (a.avgRating !== null && b.avgRating === null) return -1;
            if (a.avgRating === null && b.avgRating === null) return 0;
            return b.avgRating! - a.avgRating!;
        });
}

// ─── Public API ──────────────────────────────────────────────

export async function getJukeboxes(
    userId: string,
    groupId: string,
    options?: { isActive?: boolean }
) {
    await dbConnect();

    const group = await Group.findById(groupId).orFail();

    const query: Partial<IJukebox> = { groupId: groupId as any };
    if (options?.isActive !== undefined) {
        query.active = options.isActive;
    }

    const jukeboxes = await Jukebox.find(query)
        .sort({ createdAt: -1 })
        .limit(group.features.jukebox.settings.concurrent.length)
        .populate<{
            songs: (ISong & { submittedBy: IUser; ratings: (IRating & { userId: IUser })[] })[];
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

    return jukeboxes.map((jukebox) => {
        const userHasSubmitted = jukebox.songs.some(
            (song) => String(song.submittedBy?._id) === userId
        );

        return {
            ...jukebox,
            songs: processSongs(jukebox.songs, userId),
            userHasSubmitted,
        };
    });
}

export async function addSong(
    jukeboxId: string,
    groupId: string,
    userId: string,
    songData: {
        spotifyTrackId: string;
        title: string;
        artist: string;
        album?: string;
        coverImageUrl?: string;
    }
) {
    await dbConnect();

    const { spotifyTrackId, title, artist, album, coverImageUrl } = songData;

    if (!spotifyTrackId || !title || !artist) {
        throw new ValidationError("spotifyTrackId, title, and artist are required");
    }

    const jukebox = await Jukebox.findOne({ _id: jukeboxId, groupId, active: true });
    if (!jukebox) {
        throw new NotFoundError("Jukebox not found");
    }

    const alreadySubmitted = jukebox.songs.some(
        (song: ISong) => String(song.submittedBy) === userId
    );
    if (alreadySubmitted) {
        throw new ConflictError("You have already submitted a song to this jukebox");
    }

    const newSong: createSong = {
        spotifyTrackId,
        title,
        artist,
        album: album ?? "",
        coverImageUrl: coverImageUrl ?? "",
        submittedBy: userId,
        ratings: [],
    };

    jukebox.songs.push(newSong as ISong);
    await jukebox.save();

    return jukebox;
}

export async function rateSong(jukeboxId: string, songId: string, userId: string, rating: number) {
    await dbConnect();

    if (typeof rating !== "number" || rating <= 0 || rating > 100) {
        throw new ValidationError("Rating must be a number between 1 and 100");
    }

    const jukebox = await Jukebox.findById(jukeboxId);
    if (!jukebox) {
        throw new NotFoundError("Jukebox not found");
    }

    const song = jukebox.songs.find((s: ISong) => s._id.toString() === songId);
    if (!song) {
        throw new NotFoundError("Song not found");
    }

    if (song.submittedBy.toString() === userId) {
        throw new ConflictError("You cannot rate your own song");
    }

    const existingRating = song.ratings.find((r: IRating) => r.userId.toString() === userId);
    if (existingRating) {
        throw new ConflictError("User has already rated this song");
    }

    song.ratings.push({ userId: userId, rating } as IRating);
    await jukebox.save();

    return song;
}

export async function activateJukeboxes(group: IGroup) {
    await dbConnect();

    const today = new Date();
    if (!group.features.jukebox.settings.activationDays.includes(today.getDate())) {
        return;
    }

    await Jukebox.updateMany({ active: true, groupId: group._id }, { active: false });

    for (let i = 0; i < group.features.jukebox.settings.concurrent.length; i++) {
        const newJukebox = await new Jukebox({
            groupId: group._id,
            date: today,
            active: true,
            title: group.features.jukebox.settings.concurrent[i],
        }).save();

        const newChat = await createChatForEntity(group._id, newJukebox._id, EntityModel.Jukebox);
        newJukebox.chat = newChat._id;
        await newJukebox.save();
    }

    const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(today);
    await sendNotification(`🎶JUKEBOX - ${monthName} 🎶`, "🎶SUBMIT YOUR SONGS🎶", group._id);
}

export async function deactivateGroupJukeboxes(groupId: string) {
    await dbConnect();
    await Jukebox.updateMany({ active: true, groupId }, { active: false });
}
