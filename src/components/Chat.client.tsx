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
        const messageData = { questionId, message: newMessage, user: username };
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
      <div>
        <div>
          {messages.length > 0 ? (
            messages.map((msg:any, index:number) => (
              <div key={index}>
                {msg.user?.username || "Unknown User"}: {msg.message}
              </div>
            ))
          ) : (
            <p>No messages yet. Be the first to say something!</p>
          )}
        </div>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    );
}

export default ChatComponent;
