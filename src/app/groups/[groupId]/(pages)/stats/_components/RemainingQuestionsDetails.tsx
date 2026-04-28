"use client";

import { useEffect, useState } from "react";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { GroupStatsDTO } from "@/types/models/group";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    stats: GroupStatsDTO;
};

function Body({ stats }: { stats: GroupStatsDTO }) {
    return (
        <div className="px-4 pb-6 sm:px-0 sm:pb-0 space-y-4">
            <div className="rounded-lg border p-3 space-y-3">
                <div className="flex justify-between text-sm font-medium">
                    <span>Self-created</span>
                    <span className="text-muted-foreground">
                        {stats.selfCreatedLeftCount} left · {stats.selfCreatedUsedCount} used
                    </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                    <span>From packs</span>
                    <span className="text-muted-foreground">
                        {stats.packQuestionsLeftCount} left · {stats.packQuestionsUsedCount} used
                    </span>
                </div>
            </div>

            {stats.packs.length > 0 && (
                <div>
                    <div className="text-sm font-semibold text-muted-foreground mb-2">Packs</div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pack</TableHead>
                                <TableHead className="text-right w-16">Left</TableHead>
                                <TableHead className="text-right w-16">Used</TableHead>
                                <TableHead className="text-right w-16">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.packs.map((pack) => (
                                <TableRow key={pack.packId}>
                                    <TableCell className="font-medium truncate">
                                        {pack.name}
                                    </TableCell>
                                    <TableCell className="text-right">{pack.left}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {pack.used}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {pack.total}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

export default function RemainingQuestionsDetails({ open, onOpenChange, stats }: Props) {
    const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 640px)");
        const update = (event?: MediaQueryListEvent) => {
            setIsDesktop(event?.matches ?? mediaQuery.matches);
        };
        update();
        mediaQuery.addEventListener("change", update);
        return () => mediaQuery.removeEventListener("change", update);
    }, []);

    if (isDesktop === null) return null;

    if (!isDesktop) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Remaining questions</DrawerTitle>
                    </DrawerHeader>
                    <Body stats={stats} />
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Remaining questions</DialogTitle>
                    <DialogDescription>
                        Breakdown by source — self-created vs question packs.
                    </DialogDescription>
                </DialogHeader>
                <Body stats={stats} />
            </DialogContent>
        </Dialog>
    );
}
