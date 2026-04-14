import { ArrowLeftRight, ImageIcon, List, Star, Type, Users } from "lucide-react";
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
import { useEffect, useState } from "react";

const questionTypes = [
    { icon: Users, label: "Members", desc: "Vote on each other" },
    { icon: List, label: "Custom", desc: "Any options you want" },
    { icon: ImageIcon, label: "Image", desc: "Pick from photos" },
    { icon: Type, label: "Text", desc: "Free-form answer" },
    { icon: Star, label: "Rating", desc: "Rate 0–10" },
    { icon: ArrowLeftRight, label: "Pairing", desc: "Match things up" },
];

function QuestionTypesGrid() {
    return (
        <div className="grid grid-cols-2 gap-2 px-4 pb-6">
            {questionTypes.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
                    <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function QuestionTypesInfo({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (next: boolean) => void;
}) {
    const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 640px)");
        const sync = (e?: MediaQueryListEvent) => setIsDesktop(e?.matches ?? mq.matches);
        sync();
        mq.addEventListener("change", sync);
        return () => mq.removeEventListener("change", sync);
    }, []);

    if (isDesktop === null) return null;

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Question Types</DialogTitle>
                        <DialogDescription>Six ways to ask your group something.</DialogDescription>
                    </DialogHeader>
                    <QuestionTypesGrid />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>Question Types</DrawerTitle>
                    <DrawerDescription>Six ways to ask your group something.</DrawerDescription>
                </DrawerHeader>
                <QuestionTypesGrid />
            </DrawerContent>
        </Drawer>
    );
}
