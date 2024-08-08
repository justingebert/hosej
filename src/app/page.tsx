"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserContext';

export default function Groups() {
  const {username} = useUser();
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const router = useRouter();

  useEffect(() => {
      fetch('/api/groups')
        .then((res) => res.json())
        .then((data) => setGroups(data));
  }, []);

  
  const createGroup = async () => {
    const res = await fetch('/api/groups/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newGroupName,
        user: "test"
      }),
    });

    if (res.ok) {
      const newGroup = await res.json();
      setGroups((prevGroups) => [...prevGroups, newGroup]);
      setNewGroupName('');
    } else {
      console.error('Failed to create group');
    }
  };

  const generateJoinLink = (groupId) => {
    return `${window.location.origin}/join/${groupId}`;
  };

  return (
    <div>
      <h1>My Groups</h1>
      <ul>
        {groups.map((group) => (
          <li key={group._id}>
            <h2>{group.name}</h2>
            <p>Join Link: <a href={generateJoinLink(group._id)}>{generateJoinLink(group._id)}</a></p>
          </li>
        ))}
      </ul>

      <h2>Create New Group</h2>
      <input
        type="text"
        placeholder="Group Name"
        value={newGroupName}
        onChange={(e) => setNewGroupName(e.target.value)}
      />
      <button onClick={createGroup}>Create Group</button>
    </div>
  );
}
