"use client"

import Header from "@/components/ui/Header";
import ThemeSelector from "@/components/ui/ThemeSelector";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";

export default function SettingsPage() {
    const [userId, setUserId] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const { session, status, user } = useAuthRedirect();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated" && user) {
            setUserId(user._id);
            // Load the initial notification setting from local storage or server
            const notificationSetting = localStorage.getItem('notificationsEnabled') === 'true';
            setNotificationsEnabled(notificationSetting);
        }
    }, [status, user]);

    if (status === "loading" || !user) return <Loader loading={true} />;

    const handleGoogleSignIn = () => {
        alert("coming soon!");
    };

    const handleLogout = async () => {
        const deviceId = localStorage.getItem("deviceId");

        if (deviceId) {
            const confirmation = window.confirm("All data will be lost if you log out. Do you wish to continue?");
            if (!confirmation) {
                return;
            }
        }

        localStorage.removeItem("deviceId");
        await signOut();
        router.push("/");
    };

    const handleNotificationToggle = () => {
        const newValue = !notificationsEnabled;
        setNotificationsEnabled(newValue);
        localStorage.setItem('notificationsEnabled', newValue.toString());
        // Optionally, send this preference to your server to persist
        // saveNotificationPreference(newValue);
    };

/*     const handleReportBug = () => {
        //router.push("/report-bug"); // Assuming you have a route for reporting bugs
    };

    const handleFeatureRequest = () => {
        //router.push("/feature-request"); // Assuming you have a route for feature requests
    };
 */

    const formattedDate = new Date((user as any).createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    });

    return (
        <>
            <Header href={`/groups/`} title="Settings" rightComponent={<ThemeSelector />} />
            <div className="mt-10">
                <div className="mb-4">
                    <div className="flex items-center justify-between">
                        <span>Enable Notifications</span>
                        <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationToggle} />
                    </div>
                </div>
                <h2 className="text-xl font-bold mb-4">User Settings</h2>
                <div className="mb-4">
                    <div>User ID: {user._id}</div>
                    <div>Username: {user.username}</div>
                    <div>Joined: {formattedDate}</div>
                    <div>DeviceID: {(user as any).deviceId}</div>
                </div>
                
                <div className="flex flex-col justify-center mt-10 gap-5">
                    <Button onClick={handleGoogleSignIn} className="w-full" disabled={true}>
                        Connect with Google
                    </Button>
                    <Button onClick={handleLogout} className="w-full">
                        Logout
                    </Button>
                </div>
                
                {/* <div className="flex flex-row justify-evenly mt-10 gap-5">
                    <Button onClick={handleReportBug} className="w-full" variant={"outline"}>
                        Report a Bug
                    </Button>
                    <Button onClick={handleFeatureRequest} className="w-full" variant={"outline"}>
                        Feature Request
                    </Button>
                </div> */}
            </div>
        </>
    );
}
