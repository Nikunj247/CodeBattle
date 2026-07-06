// frontend/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext'; // Import Auth!

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth(); // Get the currently logged-in user

  useEffect(() => {
    // Only establish a socket connection if the user is actually logged in
    if (!user || !user._id) return;

    // Pass the userId in the auth payload during the handshake
    // Automatically uses the live URL in production, or localhost in development
    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    const newSocket = io(SOCKET_URL, {
      auth: {
        userId: user?._id
      },
      reconnection: true,             // Let Socket.io try to reconnect automatically
      reconnectionAttempts: 5,        // Try 5 times
      reconnectionDelay: 1000,        // Wait 1 second between tries
    });
    
    setSocket(newSocket);

    return () => newSocket.close();
  }, [user]); // Re-run this if the user logs in/out

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};