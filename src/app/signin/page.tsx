
'use client'
import React, { useState } from 'react';

const QuestionsPage = () => {
    const [userName, setUserName] = useState('');
    const [selectedUser, setSelectedUser] = useState('');

    const handleUserNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUserName(event.target.value);
    };

    const handleUserSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedUser(event.target.value);
    };

    return (
        <div>
            <div>
                <label htmlFor="userName">User Name:</label>
                <input type="text" id="userName" value={userName} onChange={handleUserNameChange} />
            </div>
            <div>
                <label htmlFor="userSelect">Select User:</label>
                <select id="userSelect" value={selectedUser} onChange={handleUserSelectChange}>
                    <option value="">Select User</option>
                    <option value="user1">User 1</option>
                    <option value="user2">User 2</option>
                    <option value="user3">User 3</option>
                </select>
            </div>
            <button >start</button>
        </div>
    );
};

export default QuestionsPage;