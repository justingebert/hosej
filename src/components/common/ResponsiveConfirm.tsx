"use client";

import type { ReactNode} from "react";
import { useEffect, useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

type ResponsiveConfirmProps = {
    trigger: ReactNode;
    title: string;
    description: ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
    confirmDisabled?: boolean;
    confirmVariant?: "default" | "destructive";
    children?: ReactNode;
    onOpenChange?: (open: boolean) => void;
};

export default function ResponsiveConfirm({
    trigger,
    title,
    description,
    confirmLabel,
    cancelLabel = "Cancel",
    onConfirm,
    confirmDisabled = false,
    confirmVariant = "destructive",
    children,
    onOpenChange,
}: ResponsiveConfirmProps) {
    const [open, setOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 640px)");

        const updateBreakpoint = (event?: MediaQueryListEvent) => {
            setIsDesktop(event?.matches ?? mediaQuery.matches);
        };

        updateBreakpoint();
        mediaQuery.addEventListener("change", updateBreakpoint);

        return () => mediaQuery.removeEventListener("change", updateBreakpoint);
    }, []);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        onOpenChange?.(nextOpen);
    };

    const handleConfirm = async () => {
        await onConfirm();
        handleOpenChange(false);
    };

    if (isDesktop === null) {
        return trigger;
    }

    if (!isDesktop) {
        return (
            <Drawer open={open} onOpenChange={handleOpenChange}>
                <DrawerTrigger asChild>{trigger}</DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{title}</DrawerTitle>
                        <DrawerDescription>{description}</DrawerDescription>
                    </DrawerHeader>
                    {children}
                    <DrawerFooter>
                        <Button
                            variant={confirmVariant}
                            onClick={handleConfirm}
                            disabled={confirmDisabled}
                        >
                            {confirmLabel}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline">{cancelLabel}</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                {children}
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={confirmVariant === "destructive" ? "bg-destructive" : undefined}
                        disabled={confirmDisabled}
                    >
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
