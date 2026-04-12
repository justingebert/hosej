"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, Image as ImageIcon } from "lucide-react";
import PWAInstallButton from "@/components/common/PWAInstallButton";
import { useAppHaptics } from "@/hooks/useAppHaptics";

export default function LandingPage() {
    // Advanced Desktop Interactivity: 3D Parallax effect for the card cluster
    const clusterRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const { play } = useAppHaptics();

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!clusterRef.current) return;
        const { left, top, width, height } = clusterRef.current.getBoundingClientRect();
        const x = (e.clientX - left - width / 2) / 20; // Depth dampening
        const y = (e.clientY - top - height / 2) / 20;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    // Mobile Device Orientation Hook for Parallax
    const orientationActive = useRef(false);

    const handleOrientation = useCallback(
        (e: DeviceOrientationEvent) => {
            const { gamma, beta } = e;
            if (gamma === null || beta === null) return;

            const normalizedGamma = Math.min(Math.max(gamma / 2, -20), 20);
            const normalizedBeta = Math.min(Math.max((beta - 50) / 2, -20), 20);

            mouseX.set(normalizedGamma);
            mouseY.set(normalizedBeta);
        },
        [mouseX, mouseY]
    );

    // On iOS, requestPermission must be called from a user gesture.
    // Request on first touch, then start listening.
    useEffect(() => {
        const DOE = DeviceOrientationEvent as unknown as {
            requestPermission?: () => Promise<string>;
        };
        const needsPermission = typeof DOE.requestPermission === "function";

        // Android / desktop — no permission needed, just listen
        if (!needsPermission && typeof window !== "undefined" && window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", handleOrientation);
            orientationActive.current = true;
            return () => window.removeEventListener("deviceorientation", handleOrientation);
        }

        // iOS — request permission on first user tap
        if (!needsPermission) return;

        const requestOnTap = async () => {
            if (orientationActive.current) return;
            try {
                const permission = await DOE.requestPermission!();
                if (permission === "granted") {
                    window.addEventListener("deviceorientation", handleOrientation);
                    orientationActive.current = true;
                }
            } catch {
                // permission denied or failed — ignore
            }
            document.removeEventListener("touchend", requestOnTap);
        };

        document.addEventListener("touchend", requestOnTap, { once: true });
        return () => {
            document.removeEventListener("touchend", requestOnTap);
            if (orientationActive.current) {
                window.removeEventListener("deviceorientation", handleOrientation);
            }
        };
    }, [handleOrientation]);

    const rotateX = useSpring(useTransform(mouseY, [-20, 20], [15, -15]), {
        stiffness: 100,
        damping: 25,
    });
    const rotateY = useSpring(useTransform(mouseX, [-20, 20], [-15, 15]), {
        stiffness: 100,
        damping: 25,
    });

    return (
        <div className="flex flex-col min-h-[calc(100dvh+3rem)] w-[calc(100%+3rem)] -m-6 bg-background overflow-x-hidden p-4 relative text-foreground rounded-none">
            {/* Premium tactile noise overlay removed as requested */}

            <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 md:px-10 flex flex-col flex-1 relative z-10">
                <header className="flex justify-between items-center w-full mt-4 mb-4 lg:mb-16">
                    <div className="text-xl font-black tracking-tight flex items-center gap-2">
                        <span>👖</span>
                        HoseJ
                    </div>
                    <Link href="/login">
                        <Button
                            variant="default"
                            className="font-bold rounded-2xl border-2 border-transparent px-8 h-12 hover:scale-105 transition-transform bg-foreground text-background"
                        >
                            Log In
                        </Button>
                    </Link>
                </header>

                {/* Main Content Split Layout */}
                <main className="flex flex-col lg:flex-row items-center justify-between w-full flex-1 gap-12 lg:gap-8 pt-8 lg:pt-0">
                    {/* Hero Copy (Left) */}
                    <section className="flex flex-col z-10 relative w-full lg:w-1/2">
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[18vw] sm:text-[120px] md:text-[140px] lg:text-[160px] xl:text-[180px] font-black tracking-tighter leading-[0.8] text-foreground lowercase"
                        >
                            build <br />
                            <span className="text-muted-foreground/50">your </span> <br />
                            crew.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="mt-10 lg:mt-14 text-xl md:text-2xl font-medium text-muted-foreground max-w-md leading-relaxed"
                        >
                            Strengthen or build your friend group. A private space to banter over
                            daily questions, drop tracks, and connect.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mt-12 flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4 lg:gap-6 w-[95%] sm:w-full max-w-md sm:max-w-none mx-auto lg:mx-0"
                        >
                            <Link
                                href="/login"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                    play("buzz");
                                }}
                            >
                                <Button className="rounded-full h-16 sm:h-20 pl-8 pr-6 text-xl sm:text-2xl font-bold bg-accent text-accent-foreground hover:bg-accent/90 w-full flex items-center justify-center sm:justify-between group shadow-xl shadow-accent/20">
                                    <span>Start Here!</span>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 ml-4 rounded-full bg-background flex items-center justify-center group-hover:scale-110 group-hover:rotate-[-45deg] transition-transform duration-300">
                                        <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                                    </div>
                                </Button>
                            </Link>

                            <div className="w-full sm:w-auto">
                                <PWAInstallButton className="rounded-full h-16 sm:h-20 px-8 text-xl sm:text-2xl font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full shadow-xl" />
                            </div>
                        </motion.div>
                    </section>

                    {/* Stacking Mini UI Cards (Right) */}
                    <section
                        className="relative w-full lg:w-1/2 h-[550px] lg:h-[700px] flex items-center justify-center perspective-[1200px]"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Decorative Glow - Using radial gradient instead of CSS blur to prevent harsh clipping boundaries on mobile */}
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none z-0"
                            style={{
                                background:
                                    "radial-gradient(circle at center, hsl(var(--accent) / 0.15) 0%, transparent 60%)",
                            }}
                        />

                        {/* Interactive Parallax Wrapper */}
                        <motion.div
                            ref={clusterRef}
                            style={{ rotateX, rotateY }}
                            className="relative w-full max-w-[400px] h-[550px] transform-style-3d cursor-crosshair group z-10"
                        >
                            {/* 1. Jukebox Card */}
                            <motion.div
                                initial={{ opacity: 0, rotate: -15, scale: 0.8 }}
                                animate={{ opacity: 1, rotate: -6, scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 80,
                                    damping: 15,
                                    delay: 0.3,
                                }}
                                className="absolute right-0 sm:right-[-20%] top-[5%] lg:top-[5%] w-[230px] sm:w-[280px] z-10 hover:z-50 hover:scale-105 transition-all duration-300"
                            >
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{
                                        duration: 5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    className="bg-card rounded-3xl p-5 shadow-2xl border border-border/80 w-full h-full"
                                >
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent  relative overflow-hidden">
                                            <Image
                                                src="/peaceuneed.jpeg"
                                                alt="Album Cover"
                                                fill
                                                unoptimized
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                Jukebox
                                            </p>
                                            <p className="text-sm sm:text-base font-bold">
                                                Recommended Tracks
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-secondary/60 rounded-2xl p-4 shadow-inner">
                                        <p className="font-bold text-lg">peace u need</p>
                                        <p className="text-sm text-muted-foreground font-medium mt-1">
                                            Fred again...
                                        </p>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* 2. Daily Question Card */}
                            <motion.div
                                initial={{ opacity: 0, rotate: 10, scale: 0.8 }}
                                animate={{ opacity: 1, rotate: 4, scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 80,
                                    damping: 15,
                                    delay: 0.45,
                                }}
                                className="absolute left-0 sm:left-[-20%] top-[20%] lg:top-[35%] w-[280px] sm:w-[360px] z-40 hover:z-50 hover:scale-105 transition-all duration-300"
                            >
                                <motion.div
                                    animate={{ y: [0, -12, 0] }}
                                    transition={{
                                        duration: 6,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: 1,
                                    }}
                                    className="bg-accent text-accent-foreground rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-accent/20 w-full h-full"
                                >
                                    <div className="flex items-center gap-3 mb-5 opacity-90">
                                        <Flame className="w-5 h-5" />
                                        <p className="text-xs font-black uppercase tracking-[0.2em]">
                                            Daily Question
                                        </p>
                                    </div>
                                    <h3 className="font-black text-2xl leading-tight mb-6">
                                        What supermarket would you be most likely to work at?
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="bg-background/20 rounded-2xl p-4 text-base font-bold flex justify-between items-center backdrop-blur-md">
                                            <span>Lidl</span> <span>42%</span>
                                        </div>
                                        <div className="bg-background/10 rounded-2xl p-4 text-base font-medium flex justify-between items-center backdrop-blur-md">
                                            <span>Edeka</span> <span>28%</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* 3. Photo Rally Card */}
                            <motion.div
                                initial={{ opacity: 0, rotate: -5, scale: 0.8 }}
                                animate={{ opacity: 1, rotate: -2, scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 80,
                                    damping: 15,
                                    delay: 0.6,
                                }}
                                className="absolute right-2 sm:right-[-10%] top-[70%] lg:top-auto lg:bottom-[0%] w-[240px] sm:w-[300px] z-50 hover:z-50 hover:scale-105 transition-all duration-300 group/rally"
                            >
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{
                                        duration: 5.5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: 2,
                                    }}
                                    className="bg-secondary text-secondary-foreground rounded-[2rem] p-4 sm:p-5 shadow-2xl border border-white/5 w-full h-full"
                                >
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center flex-shrink-0 shadow-sm group-hover/rally:rotate-12 transition-transform relative overflow-hidden">
                                                <span className="text-2xl filter drop-shadow-md">
                                                    📸
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                                                    Photo Rally
                                                </p>
                                                <p className="font-bold text-sm leading-tight ">
                                                    Best sunset of the week
                                                </p>
                                            </div>
                                        </div>
                                        <div className="h-24 w-full bg-background rounded-xl flex items-center justify-center border border-border/40 overflow-hidden relative">
                                            <Image
                                                src="/sunset.jpeg"
                                                alt="Photo Rally Image"
                                                unoptimized
                                                fill
                                                className="object-cover"
                                            />
                                            {/*<div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-transparent"></div>*/}
                                            {/*<span className="text-4xl filter drop-shadow-md">📸</span>*/}
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="mt-16 lg:mt-16 pb-8 flex items-center justify-center flex-wrap gap-x-2 sm:gap-x-4 gap-y-2 text-[9px] sm:text-xs font-black text-muted-foreground/40 uppercase tracking-[0.1em] sm:tracking-[0.3em] whitespace-nowrap">
                    <span>No Ads</span>
                    <span>•</span>
                    <span>No Algos</span>
                    <span>•</span>
                    <span>Just Friends</span>
                </footer>
            </div>
        </div>
    );
}
