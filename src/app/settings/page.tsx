"use client"

import Header from "@/components/ui/Header";
import ThemeSelector from "@/components/ui/ThemeSelector";
import settings from '/public/settings.jpg';
import Image from 'next/image'

export default function SettingsPage(){

    return (
       <>
        <Header href={`/groups/`} title="Settings" rightComponent={<ThemeSelector />}/>
        <Image src={settings} alt="cat" className="rounded-lg" />
       </>
    )
}