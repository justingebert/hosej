"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { History, Home, PieChart, Plus, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useHaptic } from "use-haptic";

export default function TabsLayout({children}: { children: React.ReactNode }) {
    const params = useParams<{ groupId: string }>();
    const groupId = params ? params.groupId : "";
    const currentPath = usePathname();
    const {triggerHaptic} = useHaptic();


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
            const {offsetLeft, offsetWidth} = activeRef;
            setIndicatorX(offsetLeft + offsetWidth / 2 - 52); // Centered under icon (28 is half indicator width)
        }
    }, [currentPath]);

    return (
        <div className="flex flex-col h-[100dvh]">
            <div className="flex-grow pb-20">{children}</div>
            <footer
                className="fixed bottom-0 left-0 right-0 flex justify-between items-center bg-secondarydark-transparent backdrop-blur-lg rounded-lg px-6 drop-shadow-md pb-6 pt-2 ">
                <motion.div
                    className="absolute w-14 h-14 rounded-lg bg-secondary z-0"
                    initial={{x: indicatorX}}
                    animate={{x: indicatorX}}
                    transition={{type: "spring", stiffness: 400, damping: 30}}
                    style={{top: "10%"}}
                />

                <Link ref={dashboardRef} href={`/groups/${groupId}/dashboard`} className="p-4 z-10"
                      onClick={triggerHaptic}>
                    <Home/>
                </Link>
                <Link ref={historyRef} href={`/groups/${groupId}/history`} className="p-4 z-10" onClick={triggerHaptic}>
                    <History/>
                </Link>
                <Link ref={createRef} href={`/groups/${groupId}/create`} className="z-10">
                    <Button className="flex items-center justify-center p-2 rounded-full bg-primary"
                            onClick={triggerHaptic}>
                        <Plus/>
                    </Button>
                </Link>
                <Link ref={statsRef} href={`/groups/${groupId}/stats`} className="p-4 z-10" onClick={triggerHaptic}>
                    <PieChart/>
                </Link>
                <Link ref={settingsRef} href={`/groups/${groupId}/settings`} className="p-4 z-10"
                      onClick={triggerHaptic}>
                    <Settings/>
                </Link>

            </footer>
        </div>
    );
}
