"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { PieChart, History, Home } from "lucide-react";

export default function TabsLayout({ children }:{children: React.ReactNode}) {
  const { groupId } = useParams<{ groupId: string }>();
  const currentPath = usePathname();

  const isActive = (path: string) => currentPath === path ? "bg-primary rounded-full text-secondary" : ""; 

  return (
    <div className="flex flex-col h-[100dvh]">
    <div className="flex-grow">{children}</div>
    <footer className="fixed bottom-0 left-0 right-0 flex justify-between items-center bg-secondarydark-transparent backdrop-blur-lg mb-6 rounded-full mx-6 drop-shadow-md">
      <Link href={`/groups/${groupId}/dashboard`} className={`${isActive(`/groups/${groupId}/dashboard`)} p-4`} >
        <Home/>
      </Link>
      <Link href={`/groups/${groupId}/leaderboard`} className={`flex items-center justify-center w-14 h-14 ${isActive(`/groups/${groupId}/leaderboard`)} p-4`}>
        <span className="text-xl">👖</span>
      </Link>
      <Link href={`/groups/${groupId}/history`} className={`${isActive(`/groups/${groupId}/history`)} p-4`}>
        <History />
      </Link>
      <Link href={`/groups/${groupId}/stats`} className={`${isActive(`/groups/${groupId}/stats`)} p-4`}>
        <PieChart  />
      </Link>
    </footer>
  </div>
  );
}
