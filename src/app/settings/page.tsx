"use client";

import Header from "@/components/ui/custom/Header";
import ThemeSelector from "@/components/ui/custom/ThemeSelector";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { requestPermissionReturnToken } from "@/hooks/useFcmToken";
import BackLink from "@/components/ui/custom/BackLink";
import { UserDataTable } from "@/app/settings/_components/userDataTable";
import { GoogleConnectButton } from "@/app/settings/_components/googleConnectButton";
import { SettingsSkeleton } from "@/app/settings/_components/settingsSkeleton";
import { ProfileEditor } from "@/app/settings/_components/ProfileEditor";

export default function SettingsPage() {
    const { status, user } = useAuthRedirect();
    const router = useRouter();

    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    const { data: adminConfig } = useSWR(user ? "/api/admin/config" : null, fetcher, {
        onError: () => {},
        shouldRetryOnError: false,
    });

    const isGlobalAdmin = !!adminConfig;

    useEffect(() => {
        if (status === "authenticated" && user) {
            const notificationSetting =
                localStorage.getItem("notificationsEnabled") === "true" ||
                !!localStorage.getItem("lastSentFcmToken");
            setNotificationsEnabled(notificationSetting);
        }
    }, [status, user]);

    if (status === "loading" || !user) return <SettingsSkeleton />;

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

                <ProfileEditor user={user} />
                <UserDataTable user={user} />
                <GoogleConnectButton user={user} className="mt-4" />

                {isGlobalAdmin && (
                    <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => router.push("/admin")}
                    >
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Dashboard
                    </Button>
                )}
            </div>
            <div className="mt-auto mb-14">
                <Button onClick={handleLogout} variant="destructive" className="w-full">
                    Logout
                </Button>
            </div>
        </div>
    );
}
