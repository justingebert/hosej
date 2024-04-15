"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";

type User = {
  _id: string;
  username: string;
};

const SignInPage = () => {
  const { createUser, setUser, getAllUsers } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [userName, setUserName] = useState("");
  const [selectedUserName, setSelectedUserName] = useState("");

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
      setUser(selectedUserName);
    }
  };

  const buttonLabel = userName ? "Create" : userName ? "Select" : "Start";

  return (
    <div>
      <div>
        <label htmlFor="userName">User Name:</label>
        <input
          type="text"
          id="userName"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
      </div>
      <div>
        {users.map((user) => (
          <button
            key={user._id}
            onClick={() => {
              setSelectedUserName(user.username);
              setUserName("");
            }}
            className={`rounded m-2 p-2 ${selectedUserName === user.username ? 'bg-slate-300' : 'bg-slate-600'}`}
          >
            {user.username}
          </button>
        ))}
      </div>
      <button onClick={handleCreateOrSelectUser} className=" bg-red-100 rounded p-2">{buttonLabel}</button>
    </div>
  );
};

export default SignInPage;
