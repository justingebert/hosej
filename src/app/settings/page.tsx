"use client"

import Header from "@/components/ui/Header";
import ThemeSelector from "@/components/ui/ThemeSelector";
import settings from '/public/settings.jpg';
import Image from 'next/image'
import { Button } from "@/components/ui/button";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";

export default function SettingsPage(){
    const [userId, setUserId] = useState('');
    const { session, status, user } = useAuthRedirect();
    const router = useRouter();

    if (status === "loading" || !user ) return <Loader loading={true}/>;

    const handleLogout = async () => {
        localStorage.removeItem("deviceId");
        await signOut();
        router.push("/");
    };

    return (
       <>
        <Header href={`/groups/`} title="Settings" rightComponent={<ThemeSelector />}/>
        <Image src={settings} alt="cat" className="rounded-lg" />
        <div>User ID: {user._id}</div>
        <div className="flex justify-center mt-10">
            <Button onClick={handleLogout}>
                Logout
            </Button>
        </div>
       </>
    )
}