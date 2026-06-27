import { NextResponse } from "next/server";

const IOS_APP_ID = "3P8B42AXJ8.app.hosej";

export function GET() {
    return NextResponse.json({
        applinks: {
            apps: [],
            details: [{ appID: IOS_APP_ID, paths: ["/join/*"] }],
        },
    });
}
