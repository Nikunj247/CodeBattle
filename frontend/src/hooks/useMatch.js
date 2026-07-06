import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export const useMatch = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // If the socket isn't connected yet, don't set up listeners
    if (!socket) return;

    // The event handler when the server successfully matches you
    const handleMatchFound = (matchData) => {
      setIsSearching(false);
      // Redirect the user to their unique arena room
      navigate(`/arena/${matchData.roomId}`);
    };

    // Listen for the specific 'match_found' trigger from the backend
    socket.on('match_found', handleMatchFound);

    // Cleanup function: remove the listener when the component unmounts
    // This prevents memory leaks and duplicate triggers
    return () => {
      socket.off('match_found', handleMatchFound);
    };
  }, [socket, navigate]);

  // Triggered when the user clicks the yellow Find Match button
  const startSearch = (preferences) => {
    setIsSearching(true);
    // Send the topic and difficulty to the backend to find a fair match
    socket?.emit('join_queue', preferences);
  };

  // Triggered if the user cancels the search before a match is found
  const cancelSearch = () => {
    setIsSearching(false);
    socket?.emit('leave_queue');
  };

  return { isSearching, startSearch, cancelSearch };
};