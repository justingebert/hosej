import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type UserContextType = {
  username: string;
  createUser: (username: string) => Promise<void>;
  setUser: (username: string) => void;
  getAllUsers: () => Promise<any[]>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }:any) => {
  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUsername(storedUser);
    } else {
      router.push('/signin');
    }
  }, [router]);

  const createUser = async (username: string) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });
      const newUser = await response.json();
      console.log("User created:", newUser);
      setUsername(username);
      localStorage.setItem("user", username); 
      router.push("/dashboard/daily");
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  };

  const setUser = async (username: string) => {
    setUsername(username);
    localStorage.setItem("user", username);
  };

  const getAllUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const users = await response.json();
      console.log("Fetched users:", users);
      return users;
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  return (
    <UserContext.Provider value={{ username, createUser, setUser, getAllUsers }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
