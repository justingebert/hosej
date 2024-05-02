import React, { useState, useEffect } from 'react';
import {useUser} from '../context/UserContext';

function ChatComponent({ questionId }:any) {
    const [messages, setMessages] = useState<any>([]);
    const [newMessage, setNewMessage] = useState('');
    const { username } = useUser();

    useEffect(() => {
        const fetchMessages = async () => {
            const response = await fetch(`/api/question/messages/${questionId}`);
            const data = await response.json();
            console.log("lLALALLALALALLA", data);
            setMessages(data);
        };

        fetchMessages();
         console.log(messages);
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
            console.log(newMsg);
            setMessages([...messages, newMsg]);
            setNewMessage('');
        }
        console.log(messages);
    };

    return (
      <div className="flex flex-col h-full">
      <div className="flex-grow overflow-auto p-4">
          {messages.length > 0 ? (
              messages.map((msg:any, index:number) => (
                  <div key={index} className={`flex mb-2 ${msg.user.username === username ? 'justify-end' : 'justify-start'}`}>
                      <div className={`inline-block p-2 rounded-lg max-w-xs ${msg.user.username === username ? 'bg-green-200' : 'bg-gray-200'}`}>
                          <div>{msg.user.username}:</div>
                          <div>{msg.message}</div>
                      </div>
                  </div>
              ))
          ) : (
              <p>No messages yet. Be the first to say something!</p>
          )}
      </div>
      <div className="border-t border-gray-300 absolute bottom-0 w-full bg-white"> {/* Fixed to bottom */}
                <div className="flex gap-2">
                    <input
                        className="flex-grow p-2 border rounded"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                    />
                    <button className="bg-blue-500 text-white p-2 rounded" onClick={handleSendMessage}>Send</button>
                </div>
            </div>
  </div>
    );
}

export default ChatComponent;
