"use client";

import { MessageCircle } from "lucide-react";

const mockMessages = [
    { isMe: false, name: "Alex", text: "lol no way pineapple won" },
    { isMe: true, name: "You", text: "pineapple gang rise up" },
    { isMe: false, name: "Sam", text: "this is why we can't have nice things" },
];

export function ChatStep() {
    return (
        <div className="flex flex-col gap-4 py-2">
            <div>
                <h2 className="text-lg font-bold mb-1">Chat</h2>
                <p className="text-sm text-muted-foreground">
                    Every question, rally, and jukebox round has its own chat thread.
                </p>
            </div>

            <div className="rounded-xl bg-secondary/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Question Chat</span>
                </div>

                <div className="flex flex-col gap-2">
                    {mockMessages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                                    msg.isMe ? "bg-primary text-primary-foreground" : "bg-secondary"
                                }`}
                            >
                                {!msg.isMe && (
                                    <p className="text-[10px] font-medium opacity-70 mb-0.5">
                                        {msg.name}
                                    </p>
                                )}
                                <p className="text-sm">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
                React and discuss results together.
            </p>
        </div>
    );
}
