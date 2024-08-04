import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../UserContext';
import { Button } from '../ui/button';
import { Send } from 'lucide-react';
import { Input } from "@/components/ui/input";

function ChatComponent({ questionId, avaiable }: any) {
  const [messages, setMessages] = useState<any>([]);
  const [newMessage, setNewMessage] = useState('');
  const { username } = useUser();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await fetch(`/api/question/messages/${questionId}`);
      const data = await response.json();
      setMessages(data);
      scrollToBottom(); // Scroll to the bottom when messages are loaded
    };

    fetchMessages();
  }, [questionId]);

  const handleSendMessage = async () => {
    const messageData = { questionId, message: newMessage, username: username };
    const response = await fetch('/api/question/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });
    if (response.ok) {
      const newMsg = await response.json();
      setMessages([...messages, newMsg.sendMessage]);
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
              <div key={index} className={`flex mb-2 ${msg.user?.username === username ? 'justify-end' : 'justify-start'}`}>
                <div className={`inline-block p-2 rounded-lg max-w-xs ${msg.user?.username === username ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  <div className={`font-bold text-xs pb-1 ${msg.user?.username === username ? 'hidden' : ''}`}>
                    {msg.user?.username}
                  </div>
                  <div className='text-m'>{msg.message}</div>
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
      {avaiable && (
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
