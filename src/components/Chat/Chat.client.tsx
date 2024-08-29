import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Send } from 'lucide-react';
import { Input } from "@/components/ui/input";

function ChatComponent({ user, entity, available }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (entity.chat) {
        const response = await fetch(`/api/${entity.groupId}/chats/${entity.chat}`);
        const data = await response.json();
        setMessages(data.messages);
      }
    };

    fetchMessages();
  }, [entity.chat, entity.groupId]); 

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return; // Prevent sending empty messages

    const messageData = { message: newMessage, userId: user._id };
    const response = await fetch(`/api/${entity.groupId}/chats/${entity.chat}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });

    if (response.ok) {
      const newMsg = await response.json();
      // Add the current user's info to the message immediately
      const completeMessage = {
        ...newMsg,
        user: {
          _id: user._id,
          username: user.username,
        },
      };
      setMessages([...messages, completeMessage]);
      setNewMessage('');
      scrollToBottom(); // Scroll to the bottom after sending a message
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length > 0 ? (
          <>
            {messages.map((msg: any, index: number) => (
              <div
                key={index}
                className={`flex mb-2 ${msg.user?._id === user._id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`inline-block p-2 rounded-lg max-w-xs ${
                    msg.user?._id === user._id ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}
                >
                  <div className={`font-bold text-xs pb-1 ${msg.user?._id === user._id ? 'hidden' : ''}`}>
                    {msg.user?.username}
                  </div>
                  <div className="text-m">{msg.message}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} /> {/* Empty div to keep track of the bottom */}
          </>
        ) : (
          <div className="flex-grow"></div> /* Empty space to push input to bottom */
        )}
      </div>

      {/* Input container */}
      {available && (
        <div className="bg-background p-4 sticky bottom-0 left-0 w-full">
          <div className="flex gap-2">
            <Input
              className="flex-grow p-2"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <Button onClick={handleSendMessage}>
              <Send size={20} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatComponent;
