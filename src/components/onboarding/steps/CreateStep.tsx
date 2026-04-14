"use client";

import { motion } from "framer-motion";
import { Camera, MessageSquareText, Plus, Settings2 } from "lucide-react";

const creations = [
    {
        icon: MessageSquareText,
        label: "Questions",
        hint: "Ask anything — any format",
        color: "text-blue-500 bg-blue-500/10",
    },
    {
        icon: Camera,
        label: "Rallies",
        hint: "Set a photo challenge",
        color: "text-emerald-500 bg-emerald-500/10",
    },
];

export function CreateStep() {
    return (
        <div className="flex flex-col gap-5 py-2">
            <div>
                <h2 className="text-lg font-bold mb-1">Make It Yours</h2>
                <p className="text-sm text-muted-foreground">
                    Packs kick things off — your group thrives on what{" "}
                    <span className="font-semibold text-foreground">you</span> create.
                </p>
            </div>

            <div className="flex flex-col gap-2">
                {creations.map(({ icon: Icon, label, hint, color }, i) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3"
                    >
                        <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${color}`}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{label}</p>
                            <p className="text-xs text-muted-foreground">{hint}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5 flex-wrap">
                Tap
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground">
                    <Plus className="h-3 w-3" />
                </span>
                in any group to start creating.
            </p>

            <div className="flex items-start gap-2 rounded-lg bg-secondary/30 px-3 py-2 text-[11px] text-muted-foreground">
                <Settings2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                    Admins set the pace — how many questions, rallies, and jukeboxes run, and how
                    often.
                </span>
            </div>
        </div>
    );
}
