import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

type UserContextType = {
  user: any;
  loading: boolean;
  createUserByDeviceId: (userName: string) => Promise<void>;
  migrateUser: (storedUser: string) =>  Promise<void>;
  setUserLocal: (user: any) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();


  const fetchUserByDeviceId = async (deviceId: string) => {
    try {
      const response = await fetch('/api/users/device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId }),
      });

      if (response.ok) {
        const user = await response.json();
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/groups');  // Redirect to groups if user is found
      } else {
        localStorage.removeItem('deviceId'); // Clear invalid deviceId
        router.push('/');  // Redirect to home page if no user is found
      }
    } catch (error) {
      console.error('Failed to fetch user by device ID:', error);
      router.push('/');  // Redirect to home page on error
    } finally {
      setLoading(false);
    }
  };

  const createUserByDeviceId = async (userName: string) => {
    const deviceId = uuidv4();

    try {
      console.log(deviceId, userName);
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId, userName }),
      });

      if (response.ok) {
        const newUser = await response.json();

        // Store the deviceId and user in localStorage
        localStorage.setItem('deviceId', deviceId);
        localStorage.setItem('user', JSON.stringify(newUser));

        setUser(newUser);
        router.push('/groups');  // Redirect to groups after user creation
      } else {
        console.error('Failed to create user:', await response.text());
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const migrateUser = async (storedUser: string) => {
    try {
      const deviceId = uuidv4();

      const response = await fetch('/api/users/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: storedUser, deviceId }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);

        // Store the new deviceId and updated user in localStorage
        localStorage.setItem('deviceId', deviceId);
        //localStorage.setItem('user', JSON.stringify(updatedUser));

        router.push('/groups');  // Redirect to groups page after migration
      } else {
        console.error('Failed to migrate user:', await response.text());
        router.push('/');  // Redirect to home page if migration fails
      }
    } catch (error) {
      console.error('Error migrating user:', error);
      router.push('/');  // Redirect to home page on error
    }
  };

  const setUserLocal = (user: any) => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('deviceId');
    router.push('/');  // Redirect to home page on logout
  };

  return (
    <UserContext.Provider value={{ user, loading, createUserByDeviceId, migrateUser, setUserLocal, logout }}>
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
