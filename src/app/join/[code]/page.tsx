import Link from "next/link";
import { Button } from "@/components/ui/button";
import dbConnect from "@/db/dbConnect";
import { getInvitePreviewByCode } from "@/lib/services/group";

// App-first invite landing. On a device with the app installed, iOS/Android open
// the app directly via the Universal/App Link and this page never renders. It only
// shows in a browser (app not installed) — preview + "Get the app", with web join
// as a secondary path. NOTE: kept on /join/* (the Universal-Link path); the actual
// web join lives at /web/join/<code> so app-installed users don't bounce back into
// the app. Public — whitelisted in proxy.ts.

// TODO: point at the TestFlight public link during beta, App Store URL at launch.
const GET_THE_APP_URL = "https://testflight.apple.com/";

export default async function JoinLandingPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    await dbConnect();
    let preview: { name: string; memberCount: number } | null = null;
    try {
        preview = await getInvitePreviewByCode(code);
    } catch {
        preview = null;
    }

    return (
        <main className="min-h-dvh flex items-center justify-center p-6">
            <div className="w-full max-w-sm text-center space-y-8">
                <h1 className="text-3xl font-bold tracking-tight">HoseJ</h1>

                {preview ? (
                    <>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">
                                You&apos;ve been invited to join
                            </p>
                            <p className="text-2xl font-semibold">{preview.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {preview.memberCount} member{preview.memberCount === 1 ? "" : "s"}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Button asChild className="w-full">
                                <a href={GET_THE_APP_URL}>Get the app</a>
                            </Button>
                            <Button asChild variant="ghost" className="w-full">
                                <Link href={`/web/join/${code}`}>Continue on web →</Link>
                            </Button>
                        </div>
                    </>
                ) : (
                    <p className="text-muted-foreground">
                        This invite link is invalid or no longer active.
                    </p>
                )}
            </div>
        </main>
    );
}
