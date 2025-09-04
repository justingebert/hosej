import {NextRequest, NextResponse} from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/db/models/user';
import {AuthedContext, withAuthAndErrors} from '@/lib/api/withAuth';
import {NotFoundError, ValidationError} from '@/lib/api/errorHandling';

export const POST = withAuthAndErrors(async (req: NextRequest, {userId}: AuthedContext) => {
    const body = await req.json();
    const {deviceId} = body;

    if (!deviceId) {
        throw new ValidationError('No deviceId provided');
    }

    await dbConnect();

    const googleUser = await User.findById(userId);
    if (!googleUser) {
        throw new NotFoundError('Google user not found');
    }

    const deviceUser = await User.findOne({deviceId});
    if (!deviceUser) {
        throw new NotFoundError('User with deviceId not found');
    }

    const googleId = googleUser.googleId;
    await User.deleteOne({_id: userId});

    deviceUser.googleId = googleId;
    deviceUser.googleConnected = true;
    deviceUser.deviceId = undefined;
    await deviceUser.save();

    return NextResponse.json({message: 'Google account linked successfully.'}, {status: 200});
});
