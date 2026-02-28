"use client";

import Header from "@/components/ui/custom/Header";
import ThemeSelector from "@/components/ui/custom/ThemeSelector";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useEffect, useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { requestPermissionReturnToken } from "@/hooks/useFcmToken";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { FcGoogle } from "react-icons/fc";
import type { Session } from "next-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonList } from "@/components/ui/custom/SkeletonList";
import BackLink from "@/components/ui/custom/BackLink";

export default function SettingsPage() {
    const { session, status, user, update } = useAuthRedirect();
    const router = useRouter();
    const { toast } = useToast();

    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [googleConnected, setGoogleConnected] = useState(false);

    useEffect(() => {
        if (status === "authenticated" && user) {
            setGoogleConnected(user.googleConnected);
            const notificationSetting =
                localStorage.getItem("notificationsEnabled") === "true" ||
                !!localStorage.getItem("lastSentFcmToken");
            setNotificationsEnabled(notificationSetting);
        }
    }, [status, user]);

    if (status === "loading" || !user) return <SettingsSkeleton />;

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
            body: JSON.stringify({ userId: user._id, deviceId }),
        });

        await signIn("credentials", { redirect: false, deviceId });
        toast({ title: "Google account unlinked!" });
    };

    const handleLogout = async () => {
        const confirmation = window.confirm(
            "If you did not Connect your Google or Mail, all data will be lost if you log out. Do you wish to continue?"
        );
        if (!confirmation) return;

        localStorage.removeItem("deviceId");
        await signOut();
        router.push("/");
    };

    const handleNotificationToggle = async () => {
        if (!notificationsEnabled) {
            const token = await requestPermissionReturnToken();
            if (token) {
                await fetch(`/api/users/push-token`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });
                localStorage.setItem("lastSentFcmToken", token);
            }
        } else {
            const token = localStorage.getItem("lastSentFcmToken");
            if (token) {
                await fetch(`/api/users/push-token`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });
                localStorage.removeItem("lastSentFcmToken");
            }
        }

        setNotificationsEnabled(!notificationsEnabled);
        localStorage.setItem("notificationsEnabled", notificationsEnabled.toString());
    };

    return (
        <div className="flex flex-col h-[100dvh]">
            <Header
                leftComponent={<BackLink href={`/groups/`} />}
                title="Settings"
                rightComponent={<ThemeSelector />}
            />
            <div className="flex-grow mt-4">
                <div className="flex items-center justify-between mb-4">
                    <span>Notifications</span>
                    <Switch
                        checked={notificationsEnabled}
                        onCheckedChange={handleNotificationToggle}
                    />
                </div>

                <UserDataTable user={user} googleConnected={googleConnected} />
                <GoogleConnectButton
                    googleConnected={googleConnected}
                    onDisconnect={handlegoogleDisconnect}
                    className="mt-4"
                />
            </div>
            <div className="mt-auto mb-14">
                <Button onClick={handleLogout} variant="destructive" className="w-full">
                    Logout
                </Button>
            </div>
        </div>
    );
}

function UserDataTable({
    user,
    googleConnected,
}: {
    user: Session["user"];
    googleConnected: boolean;
}) {
    const formattedDate = new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
    });
    const deviceId = typeof window !== "undefined" ? localStorage.getItem("deviceId") : null;

    return (
        <Table>
            <TableBody>
                <TableRow>
                    <TableCell className="font-medium">User ID</TableCell>
                    <TableCell>{user._id}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="font-medium">Username</TableCell>
                    <TableCell>{user.username}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="font-medium">Joined</TableCell>
                    <TableCell>{formattedDate}</TableCell>
                </TableRow>
                {deviceId && (
                    <TableRow>
                        <TableCell className="font-medium">Device ID</TableCell>
                        <TableCell>{deviceId}</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

function GoogleConnectButton({
    googleConnected,
    onDisconnect,
    className,
}: {
    googleConnected: boolean;
    onDisconnect: () => void;
    className: string;
}) {
    return (
        <div className={className}>
            {googleConnected ? (
                <Button onClick={onDisconnect} className="w-full" variant="destructive">
                    <FcGoogle className="mr-2" size={24} />
                    Disconnect Google
                </Button>
            ) : (
                <Button
                    onClick={async () => {
                        await signIn("google", { callbackUrl: `/connectgoogle` });
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

function SettingsSkeleton() {
    return (
        <div className="flex flex-col h-[100dvh]">
            <Header href={`/groups/`} title="Settings" rightComponent={<ThemeSelector />} />
            <div className="flex-grow mt-4 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <span>Notifications</span>
                    <Skeleton className="h-6 w-10" />
                </div>
                <SkeletonList count={4} className="h-10" />
            </div>
            <div className="mt-auto mb-14">
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    );
}
