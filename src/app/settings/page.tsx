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


    const handleGoogleSignIn = () => {
        alert("coming soon!")
        // Store the username locally before starting Google OAuth
        //localStorage.setItem("userName", userName);
        //signIn("google", { callbackUrl: "/" }); // Adjust callback URL as needed
      };

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
        <div className="flex flex-col justify-center mt-10 gap-5">
            <Button onClick={handleGoogleSignIn} className="w-full" disabled={true} >
            Connect with Google
            </Button>
            <Button onClick={handleLogout}>
                Logout
            </Button>
        </div>
       </>
    )
}