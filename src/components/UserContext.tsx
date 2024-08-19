import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type UserContextType = {
  user: any;
  loading: boolean;
  createUser: (username: string) => Promise<void>;
  setUserLocal: (user: any) => void;
  getAllUsers: () => Promise<any[]>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        router.push('/signin');
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('user');  // Clear out corrupted data if any
      router.push('/signin');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const createUser = async (username: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      const newUser = await response.json();
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      router.push('/dashboard/daily');
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const setUserLocal = (user: any) => {
    try {
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      router.push('/dashboard/daily');
    } catch (error) {
      console.error('Failed to set user locally:', error);
    }
  };

  const getAllUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const users = await response.json();
      return users;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, createUser, setUserLocal, getAllUsers }}>
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
