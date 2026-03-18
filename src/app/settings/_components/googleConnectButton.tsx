import type { Session } from "next-auth";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

export function GoogleConnectButton({
    user,
    className,
}: {
    user?: Session["user"];
    className: string;
}) {
    const { toast } = useToast();

    const handlegoogleDisconnect = async () => {
        const deviceId = uuidv4();
        localStorage.setItem("deviceId", deviceId);

        const confirmation = window.confirm(
            "If you did not Connect your Google or Mail, all data will be lost if you log out. Do you wish to continue?"
        );
        if (!confirmation) return;

        await fetch("/api/users/google", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user?._id, deviceId }),
        });

        await signIn("credentials", { redirect: false, deviceId });
        toast({ title: "Google account unlinked!" });
    };

    return (
        <div className={className}>
            {user?.googleConnected ? (
                <Button onClick={handlegoogleDisconnect} className="w-full" variant="destructive">
                    <FcGoogle className="mr-2" size={24} />
                    Disconnect Google
                </Button>
            ) : (
                <Button
                    onClick={async () => {
                        const res = await fetch("/api/users/google/connect-token", {
                            method: "POST",
                        });
                        if (!res.ok) return;
                        localStorage.removeItem("deviceId");
                        signIn("google", { callbackUrl: `/settings` });
                    }}
                    className="w-full"
                >
                    <FcGoogle className="mr-2" />
                    Connect with Google
                </Button>
            )}
        </div>
    );
}
