"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { History, Home, PieChart, Plus, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState, ViewTransition } from "react";
import { Button } from "@/components/ui/button";
import { useAppHaptics } from "@/hooks/useAppHaptics";

const TAB_ORDER = ["dashboard", "history", "create", "stats", "settings"] as const;

function getTabIndex(path: string, groupId: string): number {
    for (let i = 0; i < TAB_ORDER.length; i++) {
        if (path === `/groups/${groupId}/${TAB_ORDER[i]}`) return i;
    }
    return 0;
}

export default function TabsLayout({ children }: { children: React.ReactNode }) {
    const params = useParams<{ groupId: string }>();
    const groupId = params ? params.groupId : "";
    const currentPath = usePathname();
    const { play } = useAppHaptics();

    const currentTabIndex = getTabIndex(currentPath, groupId);
    const prevTabIndexRef = useRef(currentTabIndex);

    // To store refs for each link
    const dashboardRef = useRef<HTMLAnchorElement>(null);
    const settingsRef = useRef<HTMLAnchorElement>(null);
    const createRef = useRef<HTMLAnchorElement>(null);
    const historyRef = useRef<HTMLAnchorElement>(null);
    const statsRef = useRef<HTMLAnchorElement>(null);

    // State to hold the X position of the active link
    const [indicatorX, setIndicatorX] = useState(0);

    // Function to get the active ref based on the path
    const getActiveRef = () => {
        switch (currentPath) {
            case `/groups/${groupId}/dashboard`:
                return dashboardRef;
            case `/groups/${groupId}/settings`:
                return settingsRef;
            case `/groups/${groupId}/create`:
                return createRef;
            case `/groups/${groupId}/history`:
                return historyRef;
            case `/groups/${groupId}/stats`:
                return statsRef;
            default:
                return dashboardRef;
        }
    };

    // Update the indicator position based on the active link
    useEffect(() => {
        const activeRef = getActiveRef().current;
        if (activeRef) {
            const { offsetLeft, offsetWidth } = activeRef;
            setIndicatorX(offsetLeft + offsetWidth / 2 - 52); // Centered under icon (28 is half indicator width)
        }
    }, [currentPath]);

    // Determine slide direction based on tab index
    const getTransitionTypes = (targetTab: string): string[] => {
        const targetIndex = TAB_ORDER.indexOf(targetTab as (typeof TAB_ORDER)[number]);
        if (targetIndex > currentTabIndex) return ["slide-forward"];
        if (targetIndex < currentTabIndex) return ["slide-back"];
        return [];
    };

    // Update prev tab ref after render
    useEffect(() => {
        prevTabIndexRef.current = currentTabIndex;
    }, [currentTabIndex]);

    return (
        <div className="flex flex-col h-[100dvh]">
            <div className="flex-grow pb-20 overflow-x-hidden">
                <ViewTransition name="tab-content">{children}</ViewTransition>
            </div>
            <footer className="fixed bottom-0 left-0 right-0 flex justify-between items-center bg-secondarydark-transparent backdrop-blur-lg rounded-lg px-6 drop-shadow-md pb-6 pt-2 ">
                <motion.div
                    className="absolute w-14 h-14 rounded-lg bg-secondary z-0"
                    initial={{ x: indicatorX }}
                    animate={{ x: indicatorX }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{ top: "10%" }}
                />

                <Link
                    ref={dashboardRef}
                    href={`/groups/${groupId}/dashboard`}
                    className="p-4 z-10"
                    onClick={() => play("navigation")}
                    transitionTypes={getTransitionTypes("dashboard")}
                >
                    <Home />
                </Link>
                <Link
                    ref={historyRef}
                    href={`/groups/${groupId}/history`}
                    className="p-4 z-10"
                    onClick={() => play("navigation")}
                    transitionTypes={getTransitionTypes("history")}
                >
                    <History />
                </Link>
                <Link
                    ref={createRef}
                    href={`/groups/${groupId}/create`}
                    className="z-10"
                    onClick={() => play("navigation")}
                    transitionTypes={getTransitionTypes("create")}
                >
                    <Button
                        className="flex items-center justify-center p-2 rounded-full bg-primary"
                        haptic="none"
                    >
                        <Plus />
                    </Button>
                </Link>
                <Link
                    ref={statsRef}
                    href={`/groups/${groupId}/stats`}
                    className="p-4 z-10"
                    onClick={() => play("navigation")}
                    transitionTypes={getTransitionTypes("stats")}
                >
                    <PieChart />
                </Link>
                <Link
                    ref={settingsRef}
                    href={`/groups/${groupId}/settings`}
                    className="p-4 z-10"
                    onClick={() => play("navigation")}
                    transitionTypes={getTransitionTypes("settings")}
                >
                    <Settings />
                </Link>
            </footer>
        </div>
    );
}
