"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "../../components/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type User = {
  _id: string;
  username: string;
};

const SignInPage = () => {
  const { createUser, setUser, getAllUsers } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [userName, setUserName] = useState("");
  const [selectedUserName, setSelectedUserName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const users = await getAllUsers();
      setUsers(users);
    };
    fetchData();
  }, []);

  //TODO should be seperated into two functions
  const handleCreateOrSelectUser = () => {;
    if (userName) {
      createUser(userName);
    } else if (selectedUserName) {
      setUser(selectedUserName, selectedUserId);
    }
  };

  const buttonLabel = userName ? "Create" : userName ? "Select" : "Start";

  return (
    <div className="m-6">
      <div className="mb-20">
        <Label htmlFor="userName">User Name:</Label>
        <Input
          type="text"
          id="userName"
          placeholder="new User Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-20">
        {users.map((user) => (
          <Button
            key={user._id}
            onClick={() => {
              setSelectedUserName(user.username);
              setSelectedUserId(user._id);
              setUserName("");
            }}
            //className={`rounded m-2 p-2 ${selectedUserName === user.username ? 'bg-slate-300' : 'bg-slate-600'}`}
            variant={selectedUserName === user.username ? "default" : "secondary"}
          >
            {user.username}
          </Button>
        ))}
      </div>
      <div className="flex justify-center m-10">
        <Button onClick={handleCreateOrSelectUser} variant={"default"}>{buttonLabel}</Button>
      </div>
    </div>
  );
};

export default SignInPage;
