"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
  _id: string;
  username: string;
};

const QuestionsPage = () => {
  const [userName, setUserName] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        const data = await response.json();
        setUsers(data);
        const storedUser = localStorage.getItem("selectedUser");
        if (storedUser) {
          setSelectedUser(storedUser);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
      const selectedUser = localStorage.getItem("selectedUser");

      if (selectedUser) {
        router.push("/dashboard/daily");
      }
    };

    fetchUsers();
  }, []);

  const createUser = async () => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: userName }),
      });
      const newUser = await response.json();
      console.log("User:", newUser);
      setUsers((prevUsers) => [...prevUsers, newUser]);
      handleUserSelect(newUser.username);
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  };

  const handleUserSelect = (username: string) => {
    setSelectedUser(username);
    localStorage.setItem("selectedUser", username);
  };

  const buttonLabel = userName ? "Create" : selectedUser ? "Select" : "Start";

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
            onClick={() => handleUserSelect(user.username)}
            style={{
              backgroundColor:
                selectedUser === user.username ? "lightblue" : "initial",
              margin: "0 5px",
            }}
          >
            {user.username}
          </button>
        ))}
      </div>
      <button onClick={userName ? createUser : () => {}}>{buttonLabel}</button>
    </div>
  );
};

export default QuestionsPage;
