import {NextRequest, NextResponse} from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/db/models/user';
import {AuthedContext, withAuthAndErrors} from '@/lib/api/withAuth';
import {NotFoundError, ValidationError} from '@/lib/api/errorHandling';

// Only the authenticated user can unlink their own account
export const POST = withAuthAndErrors(async (req: NextRequest, {userId}: AuthedContext) => {
    const body = await req.json();
    const {deviceId} = body;

    if (!deviceId) {
        throw new ValidationError('No deviceId provided');
    }

    await dbConnect();

    const googleUser = await User.findById(userId);
    if (!googleUser) {
        throw new NotFoundError('User not found');
    }

    googleUser.deviceId = deviceId;
    googleUser.googleId = undefined;
    googleUser.googleConnected = false;
    await googleUser.save();

    return NextResponse.json({message: 'Google account successfully unlinked.'}, {status: 200});
});
