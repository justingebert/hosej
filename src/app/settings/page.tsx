"use client"

import Header from "@/components/ui/Header";
import ThemeSelector from "@/components/ui/ThemeSelector";

export default function GroupsPage(){

    return (
       <>
        <Header href={`/groups/`} title="Settings" rightComponent={<ThemeSelector />}/>
       </>
    )
}