import dbConnect from "@/db/dbConnect";
import Jukebox from "@/db/models/Jukebox";
import User from "@/db/models/User";
import Group from "@/db/models/Group";
import type { createSong, IJukebox, IRating, ISong } from "@/types/models/jukebox";
import type { IUser } from "@/types/models/user";
import type { IGroup } from "@/types/models/group";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errorHandling";
import { sendNotification } from "@/lib/integrations/push";
import { createChatForEntity } from "@/lib/services/chat";
import { EntityModel } from "@/types/models/chat";
import { clearActivityForEntities, recordActivity } from "@/lib/services/activity";
import { ActivityFeature, ActivityType } from "@/types/models/activityEvent";
import { resolveAvatarUrl } from "@/lib/services/user/user";
import type { Types } from "mongoose";

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
                select: "_id username avatar",
            },
            {
                path: "songs.ratings.userId",
                model: User,
                select: "_id username avatar",
            },
        ])
        .lean();

    // Collect every unique avatar key across submitters + raters and resolve once.
    const avatarKeys = new Set<string>();
    for (const jukebox of jukeboxes) {
        for (const song of jukebox.songs) {
            if (song.submittedBy?.avatar) avatarKeys.add(song.submittedBy.avatar);
            for (const r of song.ratings) {
                if (r.userId?.avatar) avatarKeys.add(r.userId.avatar);
            }
        }
    }
    const avatarUrlByKey = new Map<string, string>();
    await Promise.all(
        Array.from(avatarKeys).map(async (key) => {
            const url = await resolveAvatarUrl(key);
            if (url) avatarUrlByKey.set(key, url);
        })
    );
    const attachAvatar = <T extends { avatar?: string; avatarUrl?: string }>(u: T): T => {
        if (u?.avatar) u.avatarUrl = avatarUrlByKey.get(u.avatar);
        return u;
    };
    for (const jukebox of jukeboxes) {
        for (const song of jukebox.songs) {
            if (song.submittedBy) attachAvatar(song.submittedBy);
            for (const r of song.ratings) {
                if (r.userId) attachAvatar(r.userId);
            }
        }
    }

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

    recordActivity({
        groupId,
        actorUser: userId,
        type: ActivityType.JukeboxSongAdded,
        feature: ActivityFeature.Jukebox,
        entityId: jukeboxId,
        meta: { title, artist },
    }).catch((err) => console.error("Activity log failed", err));

    return jukebox;
}

export async function rateSong(jukeboxId: string, songId: string, userId: string, rating: number) {
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

    recordActivity({
        groupId: jukebox.groupId.toString(),
        actorUser: userId,
        type: ActivityType.JukeboxRated,
        feature: ActivityFeature.Jukebox,
        entityId: jukeboxId,
        meta: { songId },
    }).catch((err) => console.error("Activity log failed", err));

    return song;
}

export async function activateJukeboxes(group: IGroup) {
    const today = new Date();
    const activationDays = group.features.jukebox.settings.activationDays;
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const isLastDayOfMonth = today.getDate() === lastDayOfMonth;
    const shouldActivate =
        activationDays.includes(today.getDate()) ||
        (activationDays.includes(0) && isLastDayOfMonth);
    if (!shouldActivate) {
        return;
    }

    const oldActive = await Jukebox.find({ active: true, groupId: group._id }, { _id: 1 });
    await Jukebox.updateMany({ active: true, groupId: group._id }, { active: false });
    if (oldActive.length > 0) {
        clearActivityForEntities(oldActive.map((j) => j._id)).catch((err) =>
            console.error("Activity cleanup failed", err)
        );
    }

    for (let i = 0; i < group.features.jukebox.settings.concurrent.length; i++) {
        await createGroupJukebox(group._id, group.features.jukebox.settings.concurrent[i]);
    }

    const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(today);
    await sendNotification(`🎶JUKEBOX - ${monthName} 🎶`, "🎶SUBMIT YOUR SONGS🎶", group._id);
}

export async function createGroupJukebox(
    groupId: string | Types.ObjectId,
    title: string
): Promise<void> {
    const newJukebox = await new Jukebox({
        groupId,
        active: true,
        title,
    }).save();

    const newChat = await createChatForEntity(groupId, newJukebox._id, EntityModel.Jukebox);
    newJukebox.chat = newChat._id;
    await newJukebox.save();

    recordActivity({
        groupId,
        type: ActivityType.JukeboxActivated,
        feature: ActivityFeature.Jukebox,
        entityId: String(newJukebox._id),
        meta: { title: newJukebox.title },
    }).catch((err) => console.error("Activity log failed", err));
}

export async function deactivateGroupJukeboxes(groupId: string) {
    const oldActive = await Jukebox.find({ active: true, groupId }, { _id: 1 });
    await Jukebox.updateMany({ active: true, groupId }, { active: false });
    if (oldActive.length > 0) {
        clearActivityForEntities(oldActive.map((j) => j._id)).catch((err) =>
            console.error("Activity cleanup failed", err)
        );
    }
}
