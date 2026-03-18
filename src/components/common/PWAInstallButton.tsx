"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Download, Share, Plus, Home } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallButton({
    variant = "outline",
    className = "",
}: {
    variant?: React.ComponentProps<typeof Button>["variant"];
    className?: string;
} = {}) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        const isInStandaloneMode =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as Navigator & { standalone?: boolean }).standalone ||
            document.referrer.includes("android-app://");
        setIsStandalone(isInStandaloneMode);

        // Detect iOS
        const isIOSDevice =
            /iPad|iPhone|iPod/.test(navigator.userAgent) &&
            !(window as Window & { MSStream?: unknown }).MSStream;
        setIsIOS(isIOSDevice);

        // Listen for beforeinstallprompt event (for Chrome, Edge, etc.)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setDeferredPrompt(null);
        }
    };

    // Don't show if already installed
    if (isStandalone) {
        return null;
    }

    // iOS requires manual installation
    if (isIOS) {
        return (
            <Drawer>
                <DrawerTrigger asChild>
                    <Button variant={variant} className={`gap-2 ${className}`}>
                        <Download className="h-4 w-4" />
                        Install App
                    </Button>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Install HoseJ on iOS</DrawerTitle>
                        <DrawerDescription>
                            Follow these steps to add HoseJ to your home screen
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 py-2 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 p-2 bg-blue-100 dark:bg-blue-900 rounded">
                                <Share className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">1. Tap the Share button</p>
                                <p className="text-sm text-muted-foreground">
                                    Find the share icon in your Safari toolbar (box with arrow)
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 p-2 bg-blue-100 dark:bg-blue-900 rounded">
                                <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">
                                    2. Select &ldquo;Add to Home Screen&rdquo;
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Scroll down in the share menu to find this option
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 p-2 bg-blue-100 dark:bg-blue-900 rounded">
                                <Home className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">3. Tap &ldquo;Add&rdquo;</p>
                                <p className="text-sm text-muted-foreground">
                                    HoseJ will be added to your home screen like a native app
                                </p>
                            </div>
                        </div>
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline">Got it</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        );
    }

    // Standard PWA install button
    if (deferredPrompt) {
        return (
            <Button onClick={handleInstallClick} variant={variant} className={`gap-2 ${className}`}>
                <Download className="h-4 w-4" />
                Install App
            </Button>
        );
    }

    // Browser doesn't support PWA installation or prompt not available yet
    return null;
}
