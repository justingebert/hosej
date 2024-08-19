"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "../../components/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type User = {
  _id: string;
  username: string;
};

const SignInPage = () => {
  const { createUser, setUserLocal, getAllUsers } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const users = await getAllUsers();
      setUsers(users);
    };
    fetchData();
  }, []);

  const handleCreateOrSelectUser = () => {
    if (userName) {
      createUser(userName);
    } else if (selectedUser) {
      setUserLocal(selectedUser);
    }
  };

  const buttonLabel = userName ? "Create" : selectedUser ? "Select" : "Start";

  return (
    <>
      <div className="mb-20">
        <Label htmlFor="userName">User Name:</Label>
        <Input
          type="text"
          id="userName"
          placeholder="new User Name"
          value={userName}
          onChange={(e) => {
            setUserName(e.target.value);
            setSelectedUser(null); // Clear selected user when typing a new name
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-20">
        {users.map((user) => (
          <Button
            key={user._id}
            onClick={() => {
              setSelectedUser(user);
              setUserName("");
            }}
            variant={selectedUser?._id === user._id ? "default" : "secondary"}
          >
            {user.username}
          </Button>
        ))}
      </div>
      <div className="flex justify-center m-10">
        <Button onClick={handleCreateOrSelectUser} variant={"default"}>
          {buttonLabel}
        </Button>
      </div>
    </>
  );
};

export default SignInPage;
