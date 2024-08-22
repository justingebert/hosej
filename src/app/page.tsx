"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserContext';
import { IGroup } from '@/db/models/Group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Groups() {
  const {user} = useUser();
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) {
        return; // Don't fetch groups until user is available
      }
      
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: user
        }),
      });
      const groups = await res.json();
      console.log("groups", groups);
      setGroups(groups);
    }
    fetchGroups()
      
  }, [user]);

  
  const createGroup = async () => {
    console.log("user", user)
    const res = await fetch('/api/groups/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newGroupName,
        user: user
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

  const generateJoinLink = (groupId:string) => {
    return `${window.location.origin}/join/${groupId}`;
  };

  return (
    <div>
      <Card>
        {groups.map((group) => (
          <div key={group._id} onClick={() => {router.push(`/groups/${group._id}/dashboard`)}}>
            <h2>{group.name}</h2>
            <p>Join Link: <a href={generateJoinLink(group._id)}>{generateJoinLink(group._id)}</a></p>
          </div>
        ))}
      </Card>
      <Input
        type="text"
        placeholder="Group Name"
        value={newGroupName}
        onChange={(e) => setNewGroupName(e.target.value)}
      />
      <Button onClick={createGroup}>Create Group</Button>
    </div>
  );
}
