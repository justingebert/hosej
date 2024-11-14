import { getToken } from 'next-auth/jwt';
import dbConnect from './dbConnect';
import Group from '@/db/models/Group';
import { NextRequest } from 'next/server';

export async function isUserInGroup(userId:string, groupId:string) {
  await dbConnect();

  const group = await Group.findById(groupId);
  if (!group) {
    return { isAuthorized: false, status: 404, message: 'Group not found' };
  }

  const isMember = group.members.some((member:any) => member.user.toString() === userId);

  if (!isMember) {
    return { isAuthorized: false, status: 403, message: 'You are not a member of this group' };
  }

  return { isAuthorized: true };
}

export async function isUserAdmin(userId:string, groupId:string) {
  await dbConnect();

  const group = await Group.findById(groupId);
  if (!group) {
    return { isAuthorized: false, status: 404, message: 'Group not found' };
  }

  const isAdmin = group.admin === userId;
  if(!isAdmin){
    return { isAuthorized: false, status: 403, message: 'You are not an admin of this group' };
  }

  return { isAuthorized: true };
}