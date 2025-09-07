import {getToken} from 'next-auth/jwt';
import dbConnect from './dbConnect';
import Group from '@/db/models/Group';
import {NextRequest} from 'next/server';
import {ForbiddenError, NotFoundError} from "@/lib/api/errorHandling";

export async function isUserInGroup(userId: string, groupId: string) {

    const group = await Group.findById(groupId);
    if (!group) {
        throw new NotFoundError("Group not found")
    }

    const isMember = group.members.some((member: any) => member.user.toString() === userId);

    if (!isMember) {
        throw new ForbiddenError("You are not a member of this group");
    }

    return {isAuthorized: true};
}

export async function isUserAdmin(userId: string, groupId: string) {

    const group = await Group.findById(groupId);
    if (!group) {
        throw new NotFoundError("Group not found")
    }

    const isAdmin = group.admin.toString() === userId.toString();
    if (!isAdmin) {
        throw new ForbiddenError('You are not an admin of this group');
    }

}