"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { PieChart, History, Home } from "lucide-react";

export default function TabsLayout({ children }:{children: React.ReactNode}) {
  const { groupId } = useParams<{ groupId: string }>();
  const currentPath = usePathname();

  const isActive = (path: string) => currentPath === path ? "bg-secondary rounded-lg" : ""; 

  return (
    <div className="flex flex-col h-[100dvh]">
    <div className="flex-grow">{children}</div>
    <footer className="flex justify-around p-4 border-t mb-10">
      <Link href={`/groups/${groupId}/dashboard`} className={`${isActive(`/groups/${groupId}/dashboard`)} p-4`} >
        <Home/>
      </Link>
      <Link href={`/groups/${groupId}/leaderboard`} className={`${isActive(`/groups/${groupId}/leaderboard`)}} p-4`}>
        <span>👖</span>
      </Link>
      <Link href={`/groups/${groupId}/history`} className={`${isActive(`/groups/${groupId}/hitory`)} p-4`}>
        <History />
      </Link>
      <Link href={`/groups/${groupId}/stats`} className={`${isActive(`/groups/${groupId}/stats`)} p-4`}>
        <PieChart  />
      </Link>
    </footer>
  </div>
  );
}
