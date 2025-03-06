import React, { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { IChat } from "@/types/models/chat";

function ChatComponent({ user, entity, available }: any) {
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const { data, error, mutate } = useSWR<IChat>(
        entity.chat ? `/api/groups/${entity.groupId}/chats/${entity.chat}` : null,
        fetcher
    );

    const messages = data?.messages || [];

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        setSending(true);

        try {
            const messageData = { message: newMessage };
            const response = await fetch(
                `/api/groups/${entity.groupId}/chats/${entity.chat}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(messageData),
                }
            );

            if (response.ok) {
                const newMsg = await response.json();
                const completeMessage = {
                    ...newMsg,
                    user: {
                        _id: user._id,
                        username: user.username,
                    },
                };

                // Update the messages cache with the new message
                mutate(
                    (data) =>
                        ({
                            ...data,
                            messages: [...messages, completeMessage],
                        } as IChat),
                    false // Revalidate after this update
                );

                setNewMessage("");
            }
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setSending(false);
        }
    };

    if (error) return <div className="text-red-500">Failed to load messages</div>;

    return (
        <div className={`flex flex-col ${available ? "h-screen" : ""}`}>
            <div className="flex-1 overflow-y-auto p-4">
                {messages.length > 0 ? (
                    <>
                        {messages.map((msg: any, index: number) => (
                            <div
                                key={index}
                                className={`flex mb-2 ${
                                    msg.user?._id === user._id ? "justify-end" : "justify-start"
                                }`}
                            >
                                <div
                                    className={`inline-block p-2 rounded-lg max-w-xs ${
                                        msg.user?._id === user._id
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-secondary"
                                    }`}
                                >
                                    <div
                                        className={`font-bold text-xs pb-1 ${
                                            msg.user?._id === user._id ? "hidden" : ""
                                        }`}
                                    >
                                        {msg.user?.username}
                                    </div>
                                    <div className="text-m">{msg.message}</div>
                                </div>
                            </div>
                        ))}
                        {available && <div ref={messagesEndRef} />}{" "}
                        {/* Empty div to keep track of the bottom */}
                    </>
                ) : (
                    <div className="flex-grow"></div> /* Empty space to push input to bottom */
                )}
            </div>

            {available && (
                <div className="bg-background sticky pb-6 bottom-0 left-0 w-full">
                    <div className="flex gap-x-2">
                        <Input
                            className="flex-grow p-2"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <Button onClick={handleSendMessage} disabled={sending}>
                            <Send size={20} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatComponent;
