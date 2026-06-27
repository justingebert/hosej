import Group from "@/db/models/Group";
import type { GroupDocument, IGroupMember } from "@/types/models/group";
import { NotFoundError } from "@/lib/api/errorHandling";
import { generateInviteCode } from "./inviteCode";
import { joinGroup } from "./member";

/**
 * Generate an invite code that isn't already taken. The 58^8 keyspace makes
 * collisions astronomically rare; the loop is just insurance.
 */
async function generateUniqueInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateInviteCode();
        const exists = await Group.exists({ inviteCode: code });
        if (!exists) return code;
    }
    throw new Error("Failed to generate a unique invite code");
}

/**
 * Return the group's invite code, generating + persisting one if it doesn't have
 * one yet (lazy backfill for groups created before invite codes existed).
 */
export async function getOrCreateInviteCode(group: GroupDocument): Promise<string> {
    if (group.inviteCode) return group.inviteCode;
    group.inviteCode = await generateUniqueInviteCode();
    await group.save();
    return group.inviteCode;
}

/** Replace the group's invite code with a fresh one, invalidating all old links. */
export async function resetInviteCode(group: GroupDocument): Promise<string> {
    group.inviteCode = await generateUniqueInviteCode();
    await group.save();
    return group.inviteCode;
}

/**
 * Public preview for an invite code. No auth required and the groupId is never
 * exposed — only what a prospective member needs to decide to join.
 */
export async function getInvitePreviewByCode(
    code: string
): Promise<{ name: string; memberCount: number }> {
    const group = await Group.findOne({ inviteCode: code }, { name: 1, members: 1 });
    if (!group) throw new NotFoundError("Invite not found");
    return { name: group.name, memberCount: group.members.length };
}

/**
 * Join a group by invite code. Idempotent: if the user is already a member, the
 * group is returned without error (re-tapping a link shouldn't fail).
 */
export async function joinGroupByCode(userId: string, code: string): Promise<GroupDocument> {
    const group = await Group.findOne({ inviteCode: code });
    if (!group) throw new NotFoundError("Invite not found");

    const isMember = group.members.some((m: IGroupMember) => m.user.toString() === userId);
    if (isMember) return group;

    const { group: joined } = await joinGroup(userId, group._id.toString());
    return joined;
}
