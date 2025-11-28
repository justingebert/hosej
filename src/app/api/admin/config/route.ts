import { NextRequest, NextResponse } from "next/server";
import { AuthedContext, withAuthAndErrors } from "@/lib/api/withAuth";
import { ForbiddenError } from "@/lib/api/errorHandling";
import AppConfig from "@/db/models/AppConfig";
import dbConnect from "@/db/dbConnect";
import { getGlobalConfig, isGlobalAdmin } from "@/lib/userAuth";

export const revalidate = 0;

// Get admin config
export const GET = withAuthAndErrors(async (req: NextRequest, {userId}: AuthedContext) => {
    await dbConnect();

    const isAdmin = await isGlobalAdmin(userId);
    if (!isAdmin) {
        throw new ForbiddenError();
    }

    const config = await getGlobalConfig();

    return NextResponse.json(
        {
            features: config.features,
            adminUsers: config.adminUsers,
            updatedAt: config.updatedAt,
        },
        {status: 200}
    );
});

// Update admin config
export const PUT = withAuthAndErrors(async (req: NextRequest, {userId}: AuthedContext) => {
    await dbConnect();

    const isAdmin = await isGlobalAdmin(userId);
    if (!isAdmin) {
        throw new ForbiddenError();
    }

    const data = await req.json();
    const config = await AppConfig.findOne({configKey: "global_features"});

    if (!config) {
        throw new Error("Config not found");
    }

    // Update only the features if provided
    if (data.features) {
        config.features = {
            ...config.features,
            ...data.features,
        };
    }

    await config.save();

    return NextResponse.json(
        {
            features: config.features,
            adminUsers: config.adminUsers,
            updatedAt: config.updatedAt,
        },
        {status: 200}
    );
});
